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

  // Filtra somente parcelamentos ainda ativos no mês solicitado
  const active = all.filter((inst) => {
    const [sy, sm] = inst.startMonth.split("-").map(Number);
    const startIndex = sy * 12 + sm;
    const monthIndex = year * 12 + m;
    const elapsed = monthIndex - startIndex;
    return (
      elapsed >= 0 &&
      inst.currentInstallment + elapsed <= inst.totalInstallments
    );
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

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.installment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
