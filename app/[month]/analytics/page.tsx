import "server-only";
import { prisma } from "@/lib/prisma";
import { matchMarketplaces } from "@/lib/marketplace-matcher";
import { AnalyticsClient } from "@/components/monthly/analytics-client";

type ExpenseItem = {
  title: string;
  category?: string | null;
  value: number | string | { toString(): string };
  currentInstallment?: number;
};

// Nova tipagem para o mapa de categorias
type CategoryData = {
  value: number;
  items: { title: string; value: number }[];
};

async function getAnalyticsData(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr);
  const yearStart = `${year}-01`;
  const yearEnd = `${year}-12`;

  const monthlyExpenses = await prisma.weeklyExpense.findMany({
    where: { month },
    orderBy: [{ week: "asc" }],
  });
  const yearlyExpenses = await prisma.weeklyExpense.findMany({
    where: { month: { gte: yearStart, lte: yearEnd } },
  });
  const fixedExpenses = await prisma.fixedExpense.findMany({
    where: { deletedAt: null },
  });
  const installments = await prisma.installment.findMany({
    where: { deletedAt: null },
  });
  const marketplaces = await prisma.marketplace.findMany({
    orderBy: { name: "asc" },
  });

  // Agrega valor total e injeta os itens no array
  const addToCategoryMap = (
    map: Record<string, CategoryData>,
    items: ExpenseItem[],
    multiplier: number = 1,
  ) => {
    for (const item of items) {
      const key = item.category || "Outros";
      if (!map[key]) map[key] = { value: 0, items: [] };

      const calcValue = Number(item.value) * multiplier;
      map[key].value += calcValue;
      map[key].items.push({ title: item.title, value: calcValue });
    }
  };

  const installmentsForAnnual = installments.map((inst) => {
    const instMultiplier = Math.min(
      monthIndex,
      inst.currentInstallment || monthIndex,
    );
    return { ...inst, value: Number(inst.value) * instMultiplier };
  });

  // --- Categorias Mensais ---
  const categoryMap: Record<string, CategoryData> = {};
  addToCategoryMap(categoryMap, monthlyExpenses);
  addToCategoryMap(categoryMap, fixedExpenses);
  addToCategoryMap(categoryMap, installments);

  const byCategory = Object.entries(categoryMap)
    .map(([name, data]) => ({
      name,
      value: Math.round(data.value * 100) / 100,
      items: data.items.sort((a, b) => b.value - a.value), // Ordena os itens do maior pro menor
    }))
    .sort((a, b) => b.value - a.value);

  // --- Categorias Anuais ---
  const annualCategoryMap: Record<string, CategoryData> = {};
  addToCategoryMap(annualCategoryMap, yearlyExpenses);
  addToCategoryMap(annualCategoryMap, fixedExpenses, monthIndex);
  addToCategoryMap(annualCategoryMap, installmentsForAnnual);

  const annualByCategory = Object.entries(annualCategoryMap)
    .map(([name, data]) => ({
      name,
      value: Math.round(data.value * 100) / 100,
      items: data.items.sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value);

  // --- Semanas, Marketplaces e Totais (mantidos intactos) ---
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
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return {
      name: monthNames[i],
      value: Math.round((monthlyMap[key] ?? 0) * 100) / 100,
    };
  });

  const allMonthlyForMarketplace = [
    ...monthlyExpenses,
    ...fixedExpenses,
    ...installments,
  ].map((e) => ({ title: e.title, value: Number(e.value) }));
  const byMarketplace = matchMarketplaces(
    allMonthlyForMarketplace,
    marketplaces,
  );

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
