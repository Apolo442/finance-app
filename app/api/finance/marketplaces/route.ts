import "server-only";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const marketplaces = await prisma.marketplace.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(marketplaces);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "name required" }, { status: 400 });
  const marketplace = await prisma.marketplace.create({
    data: { name: name.trim() },
  });
  return NextResponse.json(marketplace);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.marketplace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
