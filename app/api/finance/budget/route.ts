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

  const budget = await prisma.monthlyBudget.findUnique({ where: { month } });
  return NextResponse.json(budget);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    month,
    incomeTotal,
    reserveAmount,
    carryOver2,
    carryOver3,
    carryOver4,
  } = body;

  const budget = await prisma.monthlyBudget.upsert({
    where: { month },
    update: {
      ...(incomeTotal !== undefined && { incomeTotal }),
      ...(reserveAmount !== undefined && { reserveAmount }),
      ...(carryOver2 !== undefined && { carryOver2 }),
      ...(carryOver3 !== undefined && { carryOver3 }),
      ...(carryOver4 !== undefined && { carryOver4 }),
    },
    create: {
      month,
      incomeTotal: incomeTotal ?? 0,
      reserveAmount: reserveAmount ?? 0,
      carryOver2: carryOver2 ?? false,
      carryOver3: carryOver3 ?? false,
      carryOver4: carryOver4 ?? false,
    },
  });

  return NextResponse.json(budget);
}
