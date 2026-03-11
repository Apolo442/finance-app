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

  const expenses = await prisma.weeklyExpense.findMany({
    where: { month },
    orderBy: [{ week: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { month, week, date, title, value, category, type, bank } =
    await req.json();

  const expense = await prisma.weeklyExpense.create({
    data: {
      month,
      week,
      date: date ? new Date(date) : null,
      title,
      value,
      category,
      type,
      bank,
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.weeklyExpense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
