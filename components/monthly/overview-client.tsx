"use client";

import { useState, useRef } from "react";
import {
  saveBudget,
  saveCarryOver,
  createWeeklyExpense,
  deleteWeeklyExpense,
} from "@/lib/api";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────

interface WeekBalance {
  budget: number;
  spent: number;
  remaining: number;
  transferred: boolean;
}

interface Expense {
  id: string;
  title: string;
  value: number;
  type: string;
  bank?: string | null;
  category?: string | null;
  date?: string | null;
  week: number;
}

interface OverviewData {
  budget: { incomeTotal: number; reserveAmount: number };
  carryOvers: { carryOver2: boolean; carryOver3: boolean; carryOver4: boolean };
  totalFixed: number;
  totalInstallments: number;
  totalWeeklySpent: number;
  netRemainder: number;
  weeklyAllocation: number;
  weeks: WeekBalance[];
  weeklyExpenses: Expense[];
}

// ─── Constants ───────────────────────────────────────────

const CATEGORIES = [
  "Alimentação",
  "Mercado",
  "Saúde",
  "Higiene & Beleza",
  "Transporte",
  "Lazer & Entretenimento",
  "Vestuário",
  "Eletrônicos & Tecnologia",
  "Casa & Utilidades",
  "Educação",
  "Presentes & Datas",
  "Serviços & Assinaturas",
  "Pets",
  "Outros",
];

const TYPES = ["CREDITO", "PIX", "RESERVADO", "OUTROS"];
const TYPE_LABELS: Record<string, string> = {
  CREDITO: "Crédito",
  PIX: "PIX",
  RESERVADO: "Reservado",
  OUTROS: "Outros",
};
const BANKS = ["NUBANK", "MERCADO_PAGO"];
const BANK_LABELS: Record<string, string> = {
  NUBANK: "Nubank",
  MERCADO_PAGO: "Mercado Pago",
};

// ─── Helpers ─────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "5px",
  color: "var(--text)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "13px",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none" as const,
};

// ─── EditableCard ─────────────────────────────────────────

function EditableCard({
  label,
  value,
  accent,
  sub,
  onSave,
}: {
  label: string;
  value: number;
  accent?: boolean;
  sub?: string;
  onSave?: (val: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    if (!onSave) return;
    setInput(value.toFixed(2).replace(".", ","));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 50);
  }

  async function commit() {
    if (!onSave) return;
    const parsed = parseFloat(input.replace(",", "."));
    if (!isNaN(parsed)) {
      setSaving(true);
      await onSave(parsed);
      setSaving(false);
    }
    setEditing(false);
  }

  return (
    <div
      onClick={!editing ? startEdit : undefined}
      style={{
        padding: "16px 20px",
        border: `1px solid ${accent ? "var(--accent-dim)" : "var(--border)"}`,
        borderRadius: "8px",
        background: accent ? "var(--accent-glow)" : "var(--bg-card)",
        cursor: onSave && !editing ? "text" : "default",
      }}
    >
      <p
        className="mono"
        style={{
          fontSize: "10px",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          marginBottom: "8px",
        }}
      >
        {label}
        {onSave && (
          <span style={{ marginLeft: "5px", fontSize: "9px" }}>✎</span>
        )}
      </p>
      {editing ? (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          disabled={saving}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--accent)",
            color: "var(--accent)",
            fontFamily: "DM Mono, monospace",
            fontSize: "20px",
            fontWeight: "500",
            outline: "none",
          }}
        />
      ) : (
        <p
          style={{
            fontSize: "20px",
            fontWeight: "500",
            color: accent ? "var(--accent)" : "var(--text)",
            letterSpacing: "-0.5px",
            fontFamily: "DM Mono, monospace",
          }}
        >
          {saving ? "..." : fmt(value)}
        </p>
      )}
      {sub && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "4px",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── AddExpenseForm ───────────────────────────────────────

function AddExpenseForm({
  month,
  week,
  onAdd,
}: {
  month: string;
  week: number;
  onAdd: () => void;
}) {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const defaultDate = today.toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState("CREDITO");
  const [bank, setBank] = useState("NUBANK");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!title.trim() || !value) return;
    const parsed = parseFloat(value.replace(",", "."));
    if (isNaN(parsed)) return;
    setLoading(true);
    await createWeeklyExpense({
      month,
      week,
      title: title.trim(),
      value: parsed,
      type,
      bank: bank || undefined,
      category: category || undefined,
      date: date || undefined,
    });
    setTitle("");
    setValue("");
    setType("CREDITO");
    setBank("NUBANK");
    setCategory("");
    setDate("defaultDate");
    setShowOptional(false);
    setLoading(false);
    onAdd();
  }

  return (
    <div
      style={{
        padding: "12px",
        background: "var(--bg)",
        borderRadius: "6px",
        border: "1px solid var(--border-subtle)",
        marginTop: "8px",
      }}
    >
      {/* Required fields */}
      <div className="flex gap-2 flex-wrap" style={{ marginBottom: "8px" }}>
        <input
          style={{ ...inputStyle, flex: "2", minWidth: "120px" }}
          placeholder="Título *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <input
          style={{ ...inputStyle, flex: "1", minWidth: "80px" }}
          placeholder="Valor *"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <select
          style={{ ...selectStyle, flex: "1", minWidth: "100px" }}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Optional toggle */}
      <button
        onClick={() => setShowOptional((v) => !v)}
        className="mono"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-dim)",
          fontSize: "10px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          marginBottom: showOptional ? "8px" : "0",
          padding: 0,
        }}
      >
        {showOptional ? "▲ ocultar opcionais" : "▼ banco / categoria / data"}
      </button>

      {showOptional && (
        <div className="flex gap-2 flex-wrap" style={{ marginBottom: "8px" }}>
          <select
            style={{ ...selectStyle, flex: "1", minWidth: "120px" }}
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          >
            <option value="">Banco (opcional)</option>
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {BANK_LABELS[b]}
              </option>
            ))}
          </select>
          <select
            style={{ ...selectStyle, flex: "1", minWidth: "140px" }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Categoria (opcional)</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            style={{
              ...inputStyle,
              flex: "1",
              minWidth: "120px",
              colorScheme: "dark",
            }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={loading || !title.trim() || !value}
        style={{
          width: "100%",
          padding: "7px",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent)",
          borderRadius: "5px",
          color: "var(--accent)",
          fontFamily: "DM Mono, monospace",
          fontSize: "11px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          opacity: loading || !title.trim() || !value ? 0.5 : 1,
        }}
      >
        {loading ? "adicionando..." : "+ ADICIONAR"}
      </button>
    </div>
  );
}

// ─── WeekCard ─────────────────────────────────────────────

function WeekCard({
  weekNum,
  week,
  expenses,
  month,
  carryField,
  isCarryActive,
  loadingCarry,
  onToggleCarry,
  onRefresh,
}: {
  weekNum: number;
  week: WeekBalance;
  expenses: Expense[];
  month: string;
  carryField?: "carryOver2" | "carryOver3" | "carryOver4";
  isCarryActive?: boolean;
  loadingCarry: string | null;
  onToggleCarry?: () => void;
  onRefresh: () => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const pct =
    week.budget > 0 ? Math.min((week.spent / week.budget) * 100, 100) : 0;
  const isOver = week.remaining < 0;

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteWeeklyExpense(id);
    setDeleting(null);
    onRefresh();
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
        flex: "1",
        minWidth: 0,
      }}
    >
      {/* Week header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: collapsed ? "none" : "1px solid var(--border-subtle)",
          cursor: "pointer",
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="mono"
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              S{weekNum}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
              {collapsed ? "▶" : "▼"}
            </span>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="mono"
              style={{
                fontSize: "11px",
                color: isOver
                  ? "var(--red)"
                  : week.transferred
                    ? "var(--text-dim)"
                    : "var(--text-muted)",
              }}
            >
              {week.transferred ? "repassado" : fmt(week.remaining)}
            </span>
            {carryField && (
              <button
                onClick={onToggleCarry}
                disabled={loadingCarry === carryField}
                title={`Repassar saldo para semana ${weekNum + 1}`}
                style={{
                  padding: "2px 7px",
                  background: isCarryActive ? "var(--accent-dim)" : "var(--bg)",
                  border: `1px solid ${isCarryActive ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "4px",
                  color: isCarryActive ? "var(--accent)" : "var(--text-dim)",
                  fontFamily: "DM Mono, monospace",
                  fontSize: "10px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {loadingCarry === carryField ? "..." : `→S${weekNum + 1}`}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: "2px",
            background: "var(--border)",
            borderRadius: "2px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: isOver ? "var(--red)" : "var(--accent)",
              borderRadius: "2px",
              transition: "width 0.3s",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "4px",
          }}
        >
          <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
            {fmt(week.budget)}
          </span>
          <span
            style={{
              fontSize: "10px",
              color: isOver ? "var(--red)" : "var(--text-dim)",
            }}
          >
            {fmt(week.spent)} gasto
          </span>
        </div>
      </div>

      {/* Expenses list + form */}
      {!collapsed && (
        <div style={{ padding: "12px 16px" }}>
          {expenses.length === 0 ? (
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-dim)",
                textAlign: "center",
                padding: "8px 0",
              }}
            >
              nenhum gasto
            </p>
          ) : (
            <div style={{ marginBottom: "4px" }}>
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {exp.title}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        marginTop: "2px",
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontSize: "10px", color: "var(--text-muted)" }}
                      >
                        {TYPE_LABELS[exp.type] ?? exp.type}
                      </span>
                      {exp.bank && (
                        <span
                          className="mono"
                          style={{ fontSize: "10px", color: "var(--text-dim)" }}
                        >
                          · {BANK_LABELS[exp.bank] ?? exp.bank}
                        </span>
                      )}
                      {exp.category && (
                        <span
                          className="mono"
                          style={{ fontSize: "10px", color: "var(--text-dim)" }}
                        >
                          · {exp.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: "13px",
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmt(Number(exp.value))}
                  </span>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    disabled={deleting === exp.id}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-dim)",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "0 2px",
                      lineHeight: 1,
                    }}
                  >
                    {deleting === exp.id ? "·" : "×"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <AddExpenseForm month={month} week={weekNum} onAdd={onRefresh} />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export function OverviewClient({
  month,
  data,
}: {
  month: string;
  data: OverviewData;
}) {
  const router = useRouter();
  const [carryOvers, setCarryOvers] = useState(data.carryOvers);
  const [loadingCarry, setLoadingCarry] = useState<string | null>(null);
  const [showComposition, setShowComposition] = useState(false);

  async function toggleCarryOver(
    field: "carryOver2" | "carryOver3" | "carryOver4",
  ) {
    setLoadingCarry(field);
    const newValue = !carryOvers[field];
    await saveCarryOver(month, field, newValue);
    setCarryOvers((prev) => ({ ...prev, [field]: newValue }));
    setLoadingCarry(null);
    router.refresh();
  }

  const monthLabel = new Date(month + "-02")
    .toLocaleDateString("pt-BR", { month: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());

  const carryFields: ("carryOver2" | "carryOver3" | "carryOver4")[] = [
    "carryOver2",
    "carryOver3",
    "carryOver4",
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p
          className="mono"
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            marginBottom: "4px",
          }}
        >
          VISÃO GERAL
        </p>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "300",
            color: "var(--text)",
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          {monthLabel}
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              fontWeight: "300",
            }}
          >
            {month.split("-")[0]}
          </span>
        </h1>
      </div>

      {/* Top cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        style={{ marginBottom: "20px" }}
      >
        <EditableCard
          label="ENTRADA"
          value={data.budget.incomeTotal}
          onSave={async (val) => {
            await saveBudget(month, val, data.budget.reserveAmount);
            router.refresh();
          }}
        />
        <EditableCard
          label="RESERVA"
          value={data.budget.reserveAmount}
          onSave={async (val) => {
            await saveBudget(month, data.budget.incomeTotal, val);
            router.refresh();
          }}
        />
        <EditableCard
          label="COMPROMETIDO"
          value={data.totalFixed + data.totalInstallments}
          sub="Fixos + Parcelas"
        />
        <EditableCard
          label="SALDO SEMANAL"
          value={data.weeklyAllocation}
          accent
          sub="por semana"
        />
      </div>

      {/* Composition toggle */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setShowComposition((v) => !v)}
          className="mono"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-dim)",
            fontSize: "10px",
            cursor: "pointer",
            letterSpacing: "0.08em",
            padding: 0,
          }}
        >
          {showComposition ? "▲ ocultar composição" : "▼ ver composição do mês"}
        </button>
        {showComposition && (
          <div
            style={{
              marginTop: "10px",
              padding: "16px 20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 32px",
            }}
          >
            {[
              {
                label: "Renda",
                value: data.budget.incomeTotal,
                color: "var(--accent)",
              },
              {
                label: "Reserva",
                value: -data.budget.reserveAmount,
                color: "var(--text-muted)",
              },
              { label: "Fixos", value: -data.totalFixed, color: "var(--red)" },
              {
                label: "Parcelamentos",
                value: -data.totalInstallments,
                color: "var(--yellow)",
              },
              {
                label: "Saldo livre",
                value: data.netRemainder,
                color: "var(--text)",
              },
            ].map((row) => (
              <div key={row.label}>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginBottom: "2px",
                  }}
                >
                  {row.label}
                </p>
                <p
                  className="mono"
                  style={{ fontSize: "14px", color: row.color }}
                >
                  {fmt(row.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weeks */}
      <div
        className="grid grid-cols-1 lg:grid-cols-4 gap-3"
        style={{ alignItems: "start" }}
      >
        {data.weeks.map((week, i) => {
          const weekNum = i + 1;
          const carryField = carryFields[i];
          const expenses = data.weeklyExpenses.filter(
            (e) => e.week === weekNum,
          );

          return (
            <WeekCard
              key={weekNum}
              weekNum={weekNum}
              week={week}
              expenses={expenses}
              month={month}
              carryField={carryField}
              isCarryActive={carryField ? carryOvers[carryField] : false}
              loadingCarry={loadingCarry}
              onToggleCarry={
                carryField ? () => toggleCarryOver(carryField) : undefined
              }
              onRefresh={() => router.refresh()}
            />
          );
        })}
      </div>
    </div>
  );
}
