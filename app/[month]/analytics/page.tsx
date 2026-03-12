import "server-only";
import { prisma } from "@/lib/prisma";
import { matchMarketplaces } from "@/lib/marketplace-matcher";
import { AnalyticsClient } from "@/components/monthly/analytics-client";

async function getAnalyticsData(month: string) {
  const [year] = month.split("-").map(Number);

  const monthlyExpenses = await prisma.weeklyExpense.findMany({
    where: { month },
    orderBy: [{ week: "asc" }],
  });

  const yearStart = `${year}-01`;
  const yearEnd = `${year}-12`;
  const yearlyExpenses = await prisma.weeklyExpense.findMany({
    where: { month: { gte: yearStart, lte: yearEnd } },
  });

  const marketplaces = await prisma.marketplace.findMany({
    orderBy: { name: "asc" },
  });

  // --- Visão Mensal: Categorias ---
  const categoryMap: Record<string, number> = {};
  for (const e of monthlyExpenses) {
    const key = e.category ?? "Outros";
    categoryMap[key] = (categoryMap[key] ?? 0) + Number(e.value);
  }
  const byCategory = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // --- Visão Anual: Categorias ---
  const annualCategoryMap: Record<string, number> = {};
  for (const e of yearlyExpenses) {
    const key = e.category ?? "Outros";
    annualCategoryMap[key] = (annualCategoryMap[key] ?? 0) + Number(e.value);
  }
  const annualByCategory = Object.entries(annualCategoryMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

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
  const expensesForMarketplace = monthlyExpenses.map((e) => ({
    title: e.title,
    value: Number(e.value),
  }));
  const byMarketplace = matchMarketplaces(expensesForMarketplace, marketplaces);

  // --- Visão Anual: Marketplaces ---
  const yearlyExpensesForMarketplace = yearlyExpenses.map((e) => ({
    title: e.title,
    value: Number(e.value),
  }));
  const annualByMarketplace = matchMarketplaces(
    yearlyExpensesForMarketplace,
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
    annualByCategory, // Propriedade adicionada
    annualByMarketplace, // Propriedade adicionada
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
