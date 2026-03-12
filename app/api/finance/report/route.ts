import "server-only";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calcNetRemainder, calcWeeklyAllocation } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month)
    return NextResponse.json({ error: "month required" }, { status: 400 });

  const [year, m] = month.split("-").map(Number);

  // Budget
  const budget = await prisma.monthlyBudget.findUnique({ where: { month } });

  // Fixed expenses
  const fixed = await prisma.fixedExpense.findMany({
    where: {
      validFrom: { lte: month },
      OR: [{ deletedAt: null }, { deletedAt: { gt: month } }],
    },
    orderBy: { title: "asc" },
  });

  // Installments
  const allInstallments = await prisma.installment.findMany({
    orderBy: { createdAt: "asc" },
  });
  const activeInstallments = allInstallments
    .filter((inst) => {
      const [sy, sm] = inst.startMonth.split("-").map(Number);
      const elapsed = year * 12 + m - (sy * 12 + sm);
      return (
        elapsed >= 0 &&
        inst.currentInstallment + elapsed <= inst.totalInstallments
      );
    })
    .map((inst) => {
      const [sy, sm] = inst.startMonth.split("-").map(Number);
      const elapsed = year * 12 + m - (sy * 12 + sm);
      return {
        title: inst.title,
        value: Number(inst.value),
        bank: inst.bank,
        category: inst.category,
        currentInstallment: inst.currentInstallment + elapsed,
        totalInstallments: inst.totalInstallments,
      };
    });

  // Weekly expenses
  const weekly = await prisma.weeklyExpense.findMany({
    where: { month },
    orderBy: [{ week: "asc" }, { createdAt: "asc" }],
  });

  // Calculations
  const incomeTotal = Number(budget?.incomeTotal ?? 0);
  const reserveAmount = Number(budget?.reserveAmount ?? 0);
  const fixedNum = fixed.map((f) => ({ value: Number(f.value) }));
  const instNum = activeInstallments.map((i) => ({ value: i.value }));
  const netRemainder = calcNetRemainder(
    incomeTotal,
    reserveAmount,
    fixedNum,
    instNum,
  );
  const weeklyAllocation = calcWeeklyAllocation(netRemainder);
  const totalFixed = fixedNum.reduce((a, f) => a + f.value, 0);
  const totalInstallments = instNum.reduce((a, i) => a + i.value, 0);

  const weeklyByWeek = [1, 2, 3, 4].map((w) => ({
    week: w,
    expenses: weekly
      .filter((e) => e.week === w)
      .map((e) => ({
        title: e.title,
        value: Number(e.value),
        type: e.type,
        bank: e.bank,
        category: e.category,
        date: e.date ? e.date.toISOString().split("T")[0] : null,
      })),
    total: weekly
      .filter((e) => e.week === w)
      .reduce((a, e) => a + Number(e.value), 0),
  }));

  return NextResponse.json({
    month,
    budget: {
      incomeTotal,
      reserveAmount,
      totalFixed,
      totalInstallments,
      netRemainder,
      weeklyAllocation,
    },
    fixed: fixed.map((f) => ({
      title: f.title,
      value: Number(f.value),
      bank: f.bank,
      category: f.category,
    })),
    installments: activeInstallments,
    weeklyByWeek,
  });
}
