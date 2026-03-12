"use client";

import { useState } from "react";
import {
  createInstallment,
  deleteInstallment,
  advanceInstallment,
} from "@/lib/api";
import { useRouter } from "next/navigation";

interface InstallmentItem {
  id: string;
  title: string;
  value: number;
  category?: string | null;
  bank: string;
  currentInstallment: number;
  totalInstallments: number;
  startMonth: string;
}

interface MonthBudget {
  netRemainder: number;
  weeklyAllocation: number;
  totalFixed: number;
  totalInstallments: number;
}

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
const BANKS = ["NUBANK", "MERCADO_PAGO"];
const BANK_LABELS: Record<string, string> = {
  NUBANK: "Nubank",
  MERCADO_PAGO: "Mercado Pago",
};

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "5px",
  color: "var(--text)",
  fontFamily: "DM Sans, sans-serif",
  fontSize: "13px",
  outline: "none",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

// ─── Advance Modal ────────────────────────────────────────

function AdvanceModal({
  item,
  month,
  budget,
  onClose,
  onSave,
}: {
  item: InstallmentItem;
  month: string;
  budget: MonthBudget;
  onClose: () => void;
  onSave: () => void;
}) {
  const remaining = item.totalInstallments - item.currentInstallment;
  const [advanceCount, setAdvanceCount] = useState(1);
  const [destination, setDestination] = useState<"week" | "fixed">("fixed");
  const [week, setWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const totalCost = item.value * advanceCount;

  // Preview impact
  const newNetRemainder =
    destination === "fixed"
      ? budget.netRemainder - totalCost
      : budget.netRemainder;
  const newWeeklyAllocation = newNetRemainder / 4;
  const weekImpact =
    destination === "week" ? budget.weeklyAllocation - totalCost : null;

  async function handleConfirm() {
    setLoading(true);
    await advanceInstallment({
      id: item.id,
      month,
      advanceCount,
      destination,
      week: destination === "week" ? week : undefined,
    });
    setLoading(false);
    onSave();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "24px",
          width: "100%",
          maxWidth: "460px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          className="mono"
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            marginBottom: "4px",
          }}
        >
          ADIANTAR PARCELAS
        </p>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "400",
            color: "var(--text)",
            marginBottom: "20px",
          }}
        >
          {item.title}
        </h2>

        {/* Info row */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "20px",
            padding: "12px",
            background: "var(--bg)",
            borderRadius: "6px",
          }}
        >
          <div>
            <p
              className="mono"
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                marginBottom: "2px",
              }}
            >
              PARCELA ATUAL
            </p>
            <p
              className="mono"
              style={{ fontSize: "14px", color: "var(--text)" }}
            >
              {item.currentInstallment}/{item.totalInstallments}
            </p>
          </div>
          <div>
            <p
              className="mono"
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                marginBottom: "2px",
              }}
            >
              RESTANTES
            </p>
            <p
              className="mono"
              style={{ fontSize: "14px", color: "var(--text)" }}
            >
              {remaining}
            </p>
          </div>
          <div>
            <p
              className="mono"
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                marginBottom: "2px",
              }}
            >
              VALOR/PARCELA
            </p>
            <p
              className="mono"
              style={{ fontSize: "14px", color: "var(--text)" }}
            >
              {fmt(item.value)}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Quantas parcelas adiantar?
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setAdvanceCount(Math.max(1, advanceCount - 1))}
                style={{
                  width: "32px",
                  height: "32px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "5px",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                −
              </button>
              <span
                className="mono"
                style={{
                  fontSize: "20px",
                  color: "var(--accent)",
                  minWidth: "32px",
                  textAlign: "center",
                }}
              >
                {advanceCount}
              </span>
              <button
                onClick={() =>
                  setAdvanceCount(Math.min(remaining, advanceCount + 1))
                }
                style={{
                  width: "32px",
                  height: "32px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "5px",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                +
              </button>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                ={" "}
                <span className="mono" style={{ color: "var(--yellow)" }}>
                  {fmt(totalCost)}
                </span>
              </span>
            </div>
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
              Onde lançar?
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["fixed", "week"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDestination(d)}
                  className="mono"
                  style={{
                    flex: 1,
                    padding: "8px",
                    background:
                      destination === d ? "var(--accent-dim)" : "var(--bg)",
                    border: `1px solid ${destination === d ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "5px",
                    color:
                      destination === d ? "var(--accent)" : "var(--text-muted)",
                    fontSize: "11px",
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                  }}
                >
                  {d === "fixed" ? "FATURA" : "SEMANA"}
                </button>
              ))}
            </div>
          </div>

          {destination === "week" && (
            <div>
              <label
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Qual semana?
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWeek(w)}
                    className="mono"
                    style={{
                      flex: 1,
                      padding: "7px",
                      background:
                        week === w ? "var(--accent-dim)" : "var(--bg)",
                      border: `1px solid ${week === w ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "5px",
                      color: week === w ? "var(--accent)" : "var(--text-muted)",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    S{w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div
          style={{
            padding: "14px",
            background: "var(--bg)",
            borderRadius: "6px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "20px",
          }}
        >
          <p
            className="mono"
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: "10px",
            }}
          >
            PREVIEW DO IMPACTO
          </p>
          {destination === "fixed" ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Custo adiantamento
                </span>
                <span
                  className="mono"
                  style={{ fontSize: "12px", color: "var(--red)" }}
                >
                  −{fmt(totalCost)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Saldo livre novo
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "12px",
                    color: newNetRemainder < 0 ? "var(--red)" : "var(--text)",
                  }}
                >
                  {fmt(newNetRemainder)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Novo saldo semanal
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "12px",
                    color:
                      newWeeklyAllocation < 0 ? "var(--red)" : "var(--accent)",
                  }}
                >
                  {fmt(newWeeklyAllocation)}
                </span>
              </div>
              <div
                style={{
                  marginTop: "6px",
                  padding: "8px",
                  background: "var(--accent-glow)",
                  borderRadius: "4px",
                  border: "1px solid var(--accent-dim)",
                }}
              >
                <p style={{ fontSize: "11px", color: "var(--accent)" }}>
                  ✓ Parcelas {item.currentInstallment + 1}–
                  {item.currentInstallment + advanceCount} pagas. A partir do
                  próximo mês este lançamento some automaticamente.
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Custo adiantamento
                </span>
                <span
                  className="mono"
                  style={{ fontSize: "12px", color: "var(--red)" }}
                >
                  −{fmt(totalCost)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Saldo restante S{week}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "12px",
                    color: weekImpact! < 0 ? "var(--red)" : "var(--text)",
                  }}
                >
                  {fmt(weekImpact!)}
                </span>
              </div>
              <div
                style={{
                  marginTop: "6px",
                  padding: "8px",
                  background: "var(--accent-glow)",
                  borderRadius: "4px",
                  border: "1px solid var(--accent-dim)",
                }}
              >
                <p style={{ fontSize: "11px", color: "var(--accent)" }}>
                  ✓ Será lançado na Semana {week} como gasto de crédito.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!confirmed ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "5px",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => setConfirmed(true)}
              style={{
                flex: 2,
                padding: "10px",
                background: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                borderRadius: "5px",
                color: "var(--accent)",
                cursor: "pointer",
                fontFamily: "DM Mono, monospace",
                fontSize: "11px",
                letterSpacing: "0.05em",
              }}
            >
              VER RESUMO →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setConfirmed(false)}
              style={{
                flex: 1,
                padding: "10px",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "5px",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
              }}
            >
              ← Voltar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                flex: 2,
                padding: "10px",
                background: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                borderRadius: "5px",
                color: "var(--accent)",
                cursor: "pointer",
                fontFamily: "DM Mono, monospace",
                fontSize: "11px",
                letterSpacing: "0.05em",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "processando..." : "CONFIRMAR ADIANTAMENTO →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Form ─────────────────────────────────────────────

function AddInstallmentForm({
  month,
  onAdd,
}: {
  month: string;
  onAdd: () => void;
}) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [bank, setBank] = useState("NUBANK");
  const [current, setCurrent] = useState("1");
  const [total, setTotal] = useState("");
  const [category, setCategory] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const parsed = parseFloat(value.replace(",", "."));
    const curr = parseInt(current);
    const tot = parseInt(total);
    if (!title.trim() || isNaN(parsed) || isNaN(curr) || isNaN(tot)) return;
    setLoading(true);
    await createInstallment({
      title: title.trim(),
      value: parsed,
      bank,
      currentInstallment: curr,
      totalInstallments: tot,
      startMonth: month,
      category: category || undefined,
    });
    setTitle("");
    setValue("");
    setBank("NUBANK");
    setCurrent("1");
    setTotal("");
    setCategory("");
    setLoading(false);
    onAdd();
  }

  return (
    <div
      style={{
        padding: "16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        marginBottom: "24px",
      }}
    >
      <p
        className="mono"
        style={{
          fontSize: "10px",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          marginBottom: "12px",
        }}
      >
        NOVO PARCELAMENTO
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <input
          style={inputStyle}
          placeholder="Título *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="Valor por parcela *"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Parcela atual *
            </label>
            <input
              style={inputStyle}
              placeholder="ex: 3"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Total *
            </label>
            <input
              style={inputStyle}
              placeholder="ex: 12"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Banco *
            </label>
            <select
              style={selectStyle}
              value={bank}
              onChange={(e) => setBank(e.target.value)}
            >
              {BANKS.map((b) => (
                <option key={b} value={b}>
                  {BANK_LABELS[b]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
          padding: 0,
          marginBottom: showOptional ? "8px" : "0",
        }}
      >
        {showOptional ? "▲ ocultar opcionais" : "▼ categoria"}
      </button>
      {showOptional && (
        <div style={{ marginBottom: "8px" }}>
          <select
            style={selectStyle}
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
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={loading || !title.trim() || !value || !total}
        style={{
          width: "100%",
          marginTop: "8px",
          padding: "8px",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent)",
          borderRadius: "5px",
          color: "var(--accent)",
          fontFamily: "DM Mono, monospace",
          fontSize: "11px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          opacity: loading || !title.trim() || !value || !total ? 0.5 : 1,
        }}
      >
        {loading ? "adicionando..." : "+ ADICIONAR"}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────

export function InstallmentsClient({
  month,
  items,
  budget,
}: {
  month: string;
  items: InstallmentItem[];
  budget: MonthBudget;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<InstallmentItem | null>(null);

  const total = items.reduce((acc, i) => acc + i.value, 0);

  async function handleDelete(id: string) {
    if (!confirm("Remover este parcelamento completamente?")) return;
    setDeleting(id);
    await deleteInstallment(id);
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <p
            className="mono"
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            PARCELAMENTOS
          </p>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "300",
              color: "var(--text)",
              letterSpacing: "-0.5px",
            }}
          >
            {new Date(month + "-02")
              .toLocaleDateString("pt-BR", { month: "long" })
              .replace(/^\w/, (c) => c.toUpperCase())}
            <span
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                fontWeight: "300",
                marginLeft: "8px",
              }}
            >
              {month.split("-")[0]}
            </span>
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            className="mono"
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              marginBottom: "2px",
            }}
          >
            TOTAL
          </p>
          <p
            className="mono"
            style={{
              fontSize: "20px",
              color: "var(--yellow)",
              fontWeight: "500",
            }}
          >
            {fmt(total)}
          </p>
        </div>
      </div>

      <AddInstallmentForm month={month} onAdd={() => router.refresh()} />

      {items.length === 0 ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--text-dim)",
            fontSize: "13px",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        >
          Nenhum parcelamento ativo neste mês.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item) => {
            const remaining = item.totalInstallments - item.currentInstallment;
            const pct =
              (item.currentInstallment / item.totalInstallments) * 100;
            return (
              <div
                key={item.id}
                style={{
                  padding: "14px 16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "var(--text)",
                        marginBottom: "4px",
                      }}
                    >
                      {item.title}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontSize: "10px", color: "var(--text-muted)" }}
                      >
                        {BANK_LABELS[item.bank] ?? item.bank}
                      </span>
                      {item.category && (
                        <span
                          className="mono"
                          style={{ fontSize: "10px", color: "var(--text-dim)" }}
                        >
                          · {item.category}
                        </span>
                      )}
                      <span
                        className="mono"
                        style={{ fontSize: "10px", color: "var(--text-dim)" }}
                      >
                        · {remaining} restante{remaining !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "2px",
                        background: "var(--border)",
                        borderRadius: "2px",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--yellow)",
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                    <p
                      className="mono"
                      style={{ fontSize: "10px", color: "var(--text-dim)" }}
                    >
                      {item.currentInstallment}/{item.totalInstallments}
                    </p>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      alignItems: "flex-end",
                    }}
                  >
                    <p
                      className="mono"
                      style={{ fontSize: "14px", color: "var(--text)" }}
                    >
                      {fmt(item.value)}
                    </p>
                    <button
                      onClick={() => setAdvancing(item)}
                      className="mono"
                      style={{
                        padding: "4px 8px",
                        background: "var(--accent-dim)",
                        border: "1px solid var(--accent)",
                        borderRadius: "4px",
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontSize: "10px",
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ↑ adiantar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      style={{
                        background: "none",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        color: "var(--red)",
                        cursor: "pointer",
                        padding: "4px 8px",
                        fontSize: "11px",
                      }}
                    >
                      {deleting === item.id ? "·" : "×"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {advancing && (
        <AdvanceModal
          item={advancing}
          month={month}
          budget={budget}
          onClose={() => setAdvancing(null)}
          onSave={() => router.refresh()}
        />
      )}
    </div>
  );
}
