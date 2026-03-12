import "server-only";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month)
    return NextResponse.json({ error: "month required" }, { status: 400 });

  const [year, m] = month.split("-").map(Number);
  const all = await prisma.installment.findMany({
    orderBy: { createdAt: "asc" },
  });

  const active = all
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
        id: inst.id,
        title: inst.title,
        value: Number(inst.value),
        category: inst.category,
        bank: inst.bank,
        currentInstallment: inst.currentInstallment + elapsed,
        totalInstallments: inst.totalInstallments,
        startMonth: inst.startMonth,
      };
    });

  return NextResponse.json(active);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    title,
    value,
    category,
    bank,
    currentInstallment,
    totalInstallments,
    startMonth,
  } = await req.json();

  const inst = await prisma.installment.create({
    data: {
      title,
      value,
      category,
      bank,
      currentInstallment,
      totalInstallments,
      startMonth,
    },
  });

  return NextResponse.json(inst);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, month, advanceCount, destination, week } = await req.json();
  // destination: "week" | "fixed"
  // advanceCount: number of installments to prepay
  // week: 1-4 (only if destination === "week")

  const inst = await prisma.installment.findUnique({ where: { id } });
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [year, m] = month.split("-").map(Number);
  const [sy, sm] = inst.startMonth.split("-").map(Number);
  const elapsed = year * 12 + m - (sy * 12 + sm);
  const currentInst = inst.currentInstallment + elapsed;
  const totalValue = Number(inst.value) * advanceCount;

  // Next month string for deletedAt
  const nextMonthDate = new Date(year, m); // m is already 0-indexed offset
  const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

  if (destination === "week") {
    await prisma.weeklyExpense.create({
      data: {
        month,
        week,
        title: `${inst.title} (${advanceCount}x adiantado)`,
        value: totalValue,
        type: "CREDITO",
        bank: inst.bank,
        category: inst.category,
      },
    });
  } else {
    // "fixed" — cria como gasto fixo temporário só nesse mês
    await prisma.fixedExpense.create({
      data: {
        title: `${inst.title} (${advanceCount}x adiantado)`,
        value: totalValue,
        bank: inst.bank,
        category: inst.category,
        validFrom: month,
        deletedAt: nextMonth,
      },
    });
  }

  // Advance the installment: update startMonth to reflect prepayment
  await prisma.installment.update({
    where: { id },
    data: {
      currentInstallment: currentInst + advanceCount,
      startMonth: month,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.installment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
