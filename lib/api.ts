export async function fetchBudget(month: string) {
  const res = await fetch(`/api/finance/budget?month=${month}`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveBudget(
  month: string,
  incomeTotal: number,
  reserveAmount: number,
) {
  const res = await fetch("/api/finance/budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, incomeTotal, reserveAmount }),
  });
  return res.json();
}

export async function fetchFixed(month: string) {
  const res = await fetch(`/api/finance/fixed?month=${month}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createFixed(data: {
  title: string;
  value: number;
  category?: string;
  bank: string;
  validFrom: string;
}) {
  const res = await fetch("/api/finance/fixed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateFixed(data: {
  id: string;
  month: string;
  title: string;
  value: number;
  category?: string;
  bank: string;
}) {
  const res = await fetch("/api/finance/fixed", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteFixed(id: string, month: string) {
  const res = await fetch("/api/finance/fixed", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, month }),
  });
  return res.json();
}

export async function fetchInstallments(month: string) {
  const res = await fetch(`/api/finance/installments?month=${month}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createInstallment(data: {
  title: string;
  value: number;
  category?: string;
  bank: string;
  currentInstallment: number;
  totalInstallments: number;
  startMonth: string;
}) {
  const res = await fetch("/api/finance/installments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteInstallment(id: string) {
  const res = await fetch("/api/finance/installments", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function fetchWeekly(month: string) {
  const res = await fetch(`/api/finance/weekly?month=${month}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createWeeklyExpense(data: {
  month: string;
  week: number;
  date?: string;
  title: string;
  value: number;
  category?: string;
  type: string;
  bank?: string;
}) {
  const res = await fetch("/api/finance/weekly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteWeeklyExpense(id: string) {
  const res = await fetch("/api/finance/weekly", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return res.json();
}

export async function saveCarryOver(
  month: string,
  field: "carryOver2" | "carryOver3" | "carryOver4",
  value: boolean,
) {
  const res = await fetch("/api/finance/budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, [field]: value }),
  });
  return res.json();
}
