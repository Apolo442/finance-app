import "server-only";
import { prisma } from "@/lib/prisma";
import {
  calcNetRemainder,
  calcWeeklyAllocation,
  calcAllWeeks,
} from "@/lib/calculations";
import { OverviewClient } from "@/components/monthly/overview-client";

async function getMonthData(month: string) {
  const [year, m] = month.split("-").map(Number);

  const [budget, fixed, allInstallments, weeklyExpenses] = await Promise.all([
    prisma.monthlyBudget.upsert({
      where: { month },
      update: {},
      create: {
        month,
        incomeTotal: 1000,
        reserveAmount: 0,
        carryOver2: false,
        carryOver3: false,
        carryOver4: false,
      },
    }),
    prisma.fixedExpense.findMany({
      where: {
        validFrom: { lte: month },
        OR: [{ deletedAt: null }, { deletedAt: { gt: month } }],
      },
    }),
    prisma.installment.findMany(),
    prisma.weeklyExpense.findMany({
      where: { month },
      orderBy: [{ week: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const installments = allInstallments.filter((inst) => {
    const [sy, sm] = inst.startMonth.split("-").map(Number);
    const elapsed = year * 12 + m - (sy * 12 + sm);
    return (
      elapsed >= 0 &&
      inst.currentInstallment + elapsed <= inst.totalInstallments
    );
  });

  const incomeTotal = Number(budget?.incomeTotal ?? 0);
  const reserveAmount = Number(budget?.reserveAmount ?? 0);
  const carryOvers = {
    carryOver2: budget?.carryOver2 ?? false,
    carryOver3: budget?.carryOver3 ?? false,
    carryOver4: budget?.carryOver4 ?? false,
  };

  const fixedNum = fixed.map((f) => ({ value: Number(f.value) }));
  const installNum = installments.map((i) => ({ value: Number(i.value) }));
  const weeklyNum = weeklyExpenses.map((e) => ({
    value: Number(e.value),
    week: e.week,
  }));

  const netRemainder = calcNetRemainder(
    incomeTotal,
    reserveAmount,
    fixedNum,
    installNum,
  );
  const weeklyAllocation = calcWeeklyAllocation(netRemainder);
  const weeks = calcAllWeeks(weeklyAllocation, weeklyNum, carryOvers);

  const totalFixed = fixedNum.reduce((acc, f) => acc + f.value, 0);
  const totalInstallments = installNum.reduce((acc, i) => acc + i.value, 0);
  const totalWeeklySpent = weeklyNum.reduce((acc, e) => acc + e.value, 0);

  return {
    budget: { incomeTotal, reserveAmount },
    carryOvers,
    totalFixed,
    totalInstallments,
    totalWeeklySpent,
    netRemainder,
    weeklyAllocation,
    weeks,
    weeklyExpenses: weeklyExpenses.map((e) => ({
      id: e.id,
      title: e.title,
      value: Number(e.value),
      type: e.type,
      bank: e.bank,
      category: e.category,
      date: e.date?.toISOString() ?? null,
      week: e.week,
    })),
  };
}

export default async function MonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const data = await getMonthData(month);
  return <OverviewClient month={month} data={data} />;
}
