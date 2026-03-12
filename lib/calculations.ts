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

export interface WeekResult {
  budget: number;
  spent: number;
  remaining: number;
  transferred: boolean; // se o saldo foi repassado para próxima semana
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

export function calcAllWeeks(
  weeklyAllocation: number,
  allExpenses: WeeklyExpense[],
  carryOvers: CarryOvers,
): WeekResult[] {
  const carryFlags = [
    false, // S1 nunca recebe carry
    carryOvers.carryOver2,
    carryOvers.carryOver3,
    carryOvers.carryOver4,
  ];

  const willTransfer = [
    carryOvers.carryOver2, // S1 transfere para S2?
    carryOvers.carryOver3, // S2 transfere para S3?
    carryOvers.carryOver4, // S3 transfere para S4?
    false, // S4 nunca transfere
  ];

  const results: WeekResult[] = [];

  for (let i = 0; i < 4; i++) {
    const weekNum = i + 1;

    // Budget = base + carry-over da semana anterior (só se o botão dela foi ativado)
    let budget = weeklyAllocation;
    if (i > 0 && carryFlags[i]) {
      const prev = results[i - 1];
      // Usa o remaining real da semana anterior (budget - spent), não o displayed
      budget = weeklyAllocation + (prev.budget - prev.spent);
    }

    const spent = allExpenses
      .filter((e) => e.week === weekNum)
      .reduce((acc, e) => acc + e.value, 0);

    const actualRemaining = budget - spent;

    // Se essa semana está transferindo para a próxima, mostra remaining = 0
    const displayed = willTransfer[i] ? 0 : actualRemaining;

    results.push({
      budget,
      spent,
      remaining: displayed,
      transferred: willTransfer[i],
    });
  }

  return results;
}
