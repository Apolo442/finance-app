"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBudget, saveCarryOver } from "@/lib/api";

interface WeekBalance {
  budget: number;
  spent: number;
  remaining: number;
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
  hasData: boolean;
}

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <div
      style={{
        padding: "20px",
        border: `1px solid ${accent ? "var(--accent-dim)" : "var(--border)"}`,
        borderRadius: "8px",
        background: accent ? "var(--accent-glow)" : "var(--bg-card)",
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
      </p>
      <p
        style={{
          fontSize: "22px",
          fontWeight: "500",
          color: accent ? "var(--accent)" : "var(--text)",
          letterSpacing: "-0.5px",
          fontFamily: "DM Mono, monospace",
        }}
      >
        {value}
      </p>
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

function BudgetSetup({ month, onSave }: { month: string; onSave: () => void }) {
  const [income, setIncome] = useState("");
  const [reserve, setReserve] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!income) return;
    setLoading(true);
    await saveBudget(
      month,
      parseFloat(income.replace(",", ".")),
      parseFloat(reserve.replace(",", ".") || "0"),
    );
    setLoading(false);
    onSave();
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontFamily: "DM Mono, monospace",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div
      style={{
        padding: "32px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        maxWidth: "400px",
      }}
    >
      <p
        className="mono"
        style={{
          fontSize: "10px",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          marginBottom: "16px",
        }}
      >
        CONFIGURAR MÊS
      </p>
      <h2
        style={{
          fontSize: "18px",
          fontWeight: "300",
          marginBottom: "24px",
          color: "var(--text)",
        }}
      >
        Qual foi sua entrada em {month}?
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Renda total (R$)
          </label>
          <input
            style={inputStyle}
            placeholder="0,00"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </div>
        <div>
          <label
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Reserva (R$)
          </label>
          <input
            style={inputStyle}
            placeholder="0,00"
            value={reserve}
            onChange={(e) => setReserve(e.target.value)}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            marginTop: "8px",
            padding: "10px",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent)",
            borderRadius: "6px",
            color: "var(--accent)",
            fontFamily: "DM Mono, monospace",
            fontSize: "12px",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          {loading ? "salvando..." : "CONFIRMAR →"}
        </button>
      </div>
    </div>
  );
}

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

  if (!data.hasData) {
    return (
      <div>
        <div style={{ marginBottom: "32px" }}>
          <p
            className="mono"
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: "6px",
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
            }}
          >
            {month}
          </h1>
        </div>
        <BudgetSetup month={month} onSave={() => router.refresh()} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p
          className="mono"
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            marginBottom: "6px",
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
          }}
        >
          {month}
        </h1>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <StatCard label="ENTRADA" value={fmt(data.budget.incomeTotal)} />
        <StatCard label="RESERVA" value={fmt(data.budget.reserveAmount)} />
        <StatCard
          label="COMPROMETIDO"
          value={fmt(data.totalFixed + data.totalInstallments)}
          sub={`Fixos + Parcelas`}
        />
        <StatCard
          label="SALDO SEMANAL"
          value={fmt(data.weeklyAllocation)}
          accent
          sub="por semana"
        />
      </div>

      {/* Breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            padding: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        >
          <p
            className="mono"
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}
          >
            COMPOSIÇÃO DO MÊS
          </p>
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
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {row.label}
              </span>
              <span
                className="mono"
                style={{ fontSize: "13px", color: row.color }}
              >
                {fmt(row.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div
          style={{
            padding: "20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        >
          <p
            className="mono"
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}
          >
            SEMANAS
          </p>
          {data.weeks.map((week, i) => {
            const weekNum = i + 1;
            const pct =
              week.budget > 0
                ? Math.min((week.spent / week.budget) * 100, 100)
                : 0;
            const isOver = week.remaining < 0;
            const carryField = `carryOver${weekNum + 1}` as
              | "carryOver2"
              | "carryOver3"
              | "carryOver4";
            const hasCarryButton = weekNum < 4;
            const isCarryActive = weekNum < 4 && carryOvers[carryField];

            return (
              <div key={i} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: "11px", color: "var(--text-muted)" }}
                  >
                    SEMANA {weekNum}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "11px",
                        color: isOver ? "var(--red)" : "var(--text-muted)",
                      }}
                    >
                      {fmt(week.remaining)} restante
                    </span>
                    {hasCarryButton && (
                      <button
                        onClick={() => toggleCarryOver(carryField)}
                        disabled={loadingCarry === carryField}
                        title={`Repassar saldo para semana ${weekNum + 1}`}
                        style={{
                          padding: "2px 8px",
                          background: isCarryActive
                            ? "var(--accent-dim)"
                            : "var(--bg)",
                          border: `1px solid ${isCarryActive ? "var(--accent)" : "var(--border)"}`,
                          borderRadius: "4px",
                          color: isCarryActive
                            ? "var(--accent)"
                            : "var(--text-dim)",
                          fontFamily: "DM Mono, monospace",
                          fontSize: "10px",
                          cursor: "pointer",
                          letterSpacing: "0.05em",
                          transition: "all 0.15s",
                        }}
                      >
                        {loadingCarry === carryField
                          ? "..."
                          : `→S${weekNum + 1}`}
                      </button>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    height: "3px",
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
                      transition: "width 0.3s ease",
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
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                    budget: {fmt(week.budget)}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                    gasto: {fmt(week.spent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
