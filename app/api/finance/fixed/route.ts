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

  const fixed = await prisma.fixedExpense.findMany({
    where: {
      validFrom: { lte: month },
      OR: [{ deletedAt: null }, { deletedAt: { gt: month } }],
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(fixed);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, value, category, bank, validFrom } = await req.json();

  const fixed = await prisma.fixedExpense.create({
    data: { title, value, category, bank, validFrom },
  });

  return NextResponse.json(fixed);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, month, title, value, category, bank } = await req.json();

  // Soft-delete o registro atual a partir deste mês
  await prisma.fixedExpense.update({
    where: { id },
    data: { deletedAt: month },
  });

  // Cria novo registro com validFrom = mês da alteração
  const updated = await prisma.fixedExpense.create({
    data: { title, value, category, bank, validFrom: month },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, month } = await req.json();

  await prisma.fixedExpense.update({
    where: { id },
    data: { deletedAt: month },
  });

  return NextResponse.json({ ok: true });
}
