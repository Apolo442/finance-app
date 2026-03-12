import "server-only";
import { prisma } from "@/lib/prisma";
import { matchMarketplaces } from "@/lib/marketplace-matcher";
import { AnalyticsClient } from "@/components/monthly/analytics-client";

// Tipagem estrita para resolver o erro do ESLint
type ExpenseItem = {
  title: string;
  category?: string | null;
  value: number | string | { toString(): string };
  currentInstallment?: number;
};

async function getAnalyticsData(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr); // Ex: "03" vira 3
  const yearStart = `${year}-01`;
  const yearEnd = `${year}-12`;

  // --- Buscas ---
  const monthlyExpenses = await prisma.weeklyExpense.findMany({
    where: { month },
    orderBy: [{ week: "asc" }],
  });
  const yearlyExpenses = await prisma.weeklyExpense.findMany({
    where: { month: { gte: yearStart, lte: yearEnd } },
  });

  const fixedExpenses = await prisma.fixedExpense.findMany();
  const installments = await prisma.installment.findMany();

  const marketplaces = await prisma.marketplace.findMany({
    orderBy: { name: "asc" },
  });

  // --- Função Auxiliar de Agregação ---
  const addToCategoryMap = (
    map: Record<string, number>,
    items: ExpenseItem[],
    multiplier: number = 1,
  ) => {
    for (const item of items) {
      const key = item.category || "Outros";
      map[key] = (map[key] ?? 0) + Number(item.value) * multiplier;
    }
  };

  // Prepara parcelamentos para a visão anual considerando a parcela atual
  const installmentsForAnnual = installments.map((inst) => {
    const instMultiplier = Math.min(
      monthIndex,
      inst.currentInstallment || monthIndex,
    );
    return { ...inst, value: Number(inst.value) * instMultiplier };
  });

  // --- Visão Mensal: Categorias ---
  const categoryMap: Record<string, number> = {};
  addToCategoryMap(categoryMap, monthlyExpenses);
  addToCategoryMap(categoryMap, fixedExpenses);
  addToCategoryMap(categoryMap, installments);

  const byCategory = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // --- Visão Anual: Categorias ---
  const annualCategoryMap: Record<string, number> = {};
  addToCategoryMap(annualCategoryMap, yearlyExpenses);
  addToCategoryMap(annualCategoryMap, fixedExpenses, monthIndex); // Ex: Valor * 3 meses
  addToCategoryMap(annualCategoryMap, installmentsForAnnual); // Já multiplicado individualmente

  const annualByCategory = Object.entries(annualCategoryMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // --- Visão Mensal: Semanas e Evolução Mensal ---
  const byWeek = [1, 2, 3, 4].map((w) => ({
    name: `S${w}`,
    value: monthlyExpenses
      .filter((e) => e.week === w)
      .reduce((acc, e) => acc + Number(e.value), 0),
  }));

  const monthlyMap: Record<string, number> = {};
  for (const e of yearlyExpenses) {
    monthlyMap[e.month] = (monthlyMap[e.month] ?? 0) + Number(e.value);
  }
  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const byMonthYear = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const key = `${year}-${m}`;
    return {
      name: monthNames[i],
      value: Math.round((monthlyMap[key] ?? 0) * 100) / 100,
    };
  });

  // --- Visão Mensal: Marketplaces ---
  const allMonthlyForMarketplace = [
    ...monthlyExpenses,
    ...fixedExpenses,
    ...installments,
  ].map((e) => ({ title: e.title, value: Number(e.value) }));
  const byMarketplace = matchMarketplaces(
    allMonthlyForMarketplace,
    marketplaces,
  );

  // --- Visão Anual: Marketplaces ---
  const projectedYearlyFixed = fixedExpenses.map((e) => ({
    title: e.title,
    value: Number(e.value) * monthIndex,
  }));
  const projectedYearlyInst = installmentsForAnnual.map((e) => ({
    title: e.title,
    value: Number(e.value),
  }));

  const allYearlyForMarketplace = [
    ...yearlyExpenses.map((e) => ({ title: e.title, value: Number(e.value) })),
    ...projectedYearlyFixed,
    ...projectedYearlyInst,
  ];
  const annualByMarketplace = matchMarketplaces(
    allYearlyForMarketplace,
    marketplaces,
  );

  // --- Totais Mensais ---
  const totalMonth = monthlyExpenses.reduce(
    (acc, e) => acc + Number(e.value),
    0,
  );
  const totalCredit = monthlyExpenses
    .filter((e) => e.type === "CREDITO")
    .reduce((acc, e) => acc + Number(e.value), 0);
  const totalPix = monthlyExpenses
    .filter((e) => e.type === "PIX")
    .reduce((acc, e) => acc + Number(e.value), 0);
  const totalReserved = monthlyExpenses
    .filter((e) => e.type === "RESERVADO")
    .reduce((acc, e) => acc + Number(e.value), 0);
  const totalOthers = monthlyExpenses
    .filter((e) => e.type === "OUTROS")
    .reduce((acc, e) => acc + Number(e.value), 0);

  return {
    month,
    byCategory,
    byWeek,
    byMonthYear,
    annualByCategory,
    annualByMarketplace,
    byMarketplace,
    marketplaces,
    totals: {
      total: totalMonth,
      credit: totalCredit,
      pix: totalPix,
      reserved: totalReserved,
      others: totalOthers,
    },
  };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const data = await getAnalyticsData(month);
  return <AnalyticsClient data={data} />;
}
