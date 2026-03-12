import "server-only";
import { prisma } from "@/lib/prisma";
import { calcNetRemainder, calcWeeklyAllocation } from "@/lib/calculations";
import { InstallmentsClient } from "@/components/monthly/installments-client";

async function getInstallmentsData(month: string) {
  const [year, m] = month.split("-").map(Number);

  const budget = await prisma.monthlyBudget.findUnique({ where: { month } });
  const fixed = await prisma.fixedExpense.findMany({
    where: {
      validFrom: { lte: month },
      OR: [{ deletedAt: null }, { deletedAt: { gt: month } }],
    },
  });
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

  const incomeTotal = Number(budget?.incomeTotal ?? 1000);
  const reserveAmount = Number(budget?.reserveAmount ?? 0);
  const fixedNum = fixed.map((f) => ({ value: Number(f.value) }));
  const installNum = active.map((i) => ({ value: i.value }));
  const netRemainder = calcNetRemainder(
    incomeTotal,
    reserveAmount,
    fixedNum,
    installNum,
  );
  const weeklyAllocation = calcWeeklyAllocation(netRemainder);

  return {
    items: active,
    budget: {
      netRemainder,
      weeklyAllocation,
      totalFixed: fixedNum.reduce((a, f) => a + f.value, 0),
      totalInstallments: installNum.reduce((a, i) => a + i.value, 0),
    },
  };
}

export default async function InstallmentsPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const { items, budget } = await getInstallmentsData(month);
  return <InstallmentsClient month={month} items={items} budget={budget} />;
}
