interface FixedExpense {
  value: number;
}

interface Installment {
  value: number;
}

interface WeeklyExpense {
  value: number;
  week: number;
}

interface CarryOvers {
  carryOver2: boolean;
  carryOver3: boolean;
  carryOver4: boolean;
}

export function calcNetRemainder(
  incomeTotal: number,
  reserveAmount: number,
  fixedExpenses: FixedExpense[],
  installments: Installment[],
): number {
  const fixed = fixedExpenses.reduce((acc, e) => acc + e.value, 0);
  const installs = installments.reduce((acc, i) => acc + i.value, 0);
  return incomeTotal - reserveAmount - fixed - installs;
}

export function calcWeeklyAllocation(netRemainder: number): number {
  return netRemainder / 4;
}

export function calcWeeklyBalance(
  weekNumber: number,
  weeklyAllocation: number,
  allExpenses: WeeklyExpense[],
  carryOvers: CarryOvers,
): { budget: number; spent: number; remaining: number } {
  const carryOverFlags: Record<number, boolean> = {
    2: carryOvers.carryOver2,
    3: carryOvers.carryOver3,
    4: carryOvers.carryOver4,
  };

  let bonus = 0;

  for (let w = 1; w < weekNumber; w++) {
    if (!carryOverFlags[w + 1]) continue;
    const weekExpenses = allExpenses.filter((e) => e.week === w);
    const prevBudget = weeklyAllocation + (w > 1 ? bonus : 0);
    const spent = weekExpenses.reduce((acc, e) => acc + e.value, 0);
    bonus = prevBudget - spent;
  }

  const budget = weeklyAllocation + bonus;
  const spent = allExpenses
    .filter((e) => e.week === weekNumber)
    .reduce((acc, e) => acc + e.value, 0);

  return { budget, spent, remaining: budget - spent };
}
