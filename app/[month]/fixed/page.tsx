import "server-only";
import { prisma } from "@/lib/prisma";
import { FixedClient } from "@/components/monthly/fixed-client";

async function getFixedData(month: string) {
  const fixed = await prisma.fixedExpense.findMany({
    where: {
      validFrom: { lte: month },
      OR: [{ deletedAt: null }, { deletedAt: { gt: month } }],
    },
    orderBy: { createdAt: "asc" },
  });

  return fixed.map((f) => ({
    id: f.id,
    title: f.title,
    value: Number(f.value),
    category: f.category,
    bank: f.bank,
    validFrom: f.validFrom,
  }));
}

export default async function FixedPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const items = await getFixedData(month);
  return <FixedClient month={month} items={items} />;
}
