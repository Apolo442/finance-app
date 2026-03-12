"use client";

import { useState } from "react";
import { createFixed, updateFixed, deleteFixed } from "@/lib/api";
import { useRouter } from "next/navigation";

interface FixedItem {
  id: string;
  title: string;
  value: number;
  category?: string | null;
  bank: string;
  validFrom: string;
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

// ─── Add Form ─────────────────────────────────────────────

function AddFixedForm({ month, onAdd }: { month: string; onAdd: () => void }) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [bank, setBank] = useState("NUBANK");
  const [category, setCategory] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!title.trim() || !value) return;
    const parsed = parseFloat(value.replace(",", "."));
    if (isNaN(parsed)) return;
    setLoading(true);
    await createFixed({
      title: title.trim(),
      value: parsed,
      bank,
      category: category || undefined,
      validFrom: month,
    });
    setTitle("");
    setValue("");
    setBank("NUBANK");
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
        NOVO GASTO FIXO
      </p>
      {/* Mod */}
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
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            style={inputStyle}
            placeholder="Valor *"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
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
      {/*  */}
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
        disabled={loading || !title.trim() || !value}
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
          opacity: loading || !title.trim() || !value ? 0.5 : 1,
        }}
      >
        {loading ? "adicionando..." : "+ ADICIONAR"}
      </button>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────

function EditModal({
  item,
  month,
  onClose,
  onSave,
}: {
  item: FixedItem;
  month: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [value, setValue] = useState(item.value.toFixed(2).replace(".", ","));
  const [bank, setBank] = useState(item.bank);
  const [category, setCategory] = useState(item.category ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const parsed = parseFloat(value.replace(",", "."));
    if (!title.trim() || isNaN(parsed)) return;
    setLoading(true);
    await updateFixed({
      id: item.id,
      month,
      title: title.trim(),
      value: parsed,
      bank,
      category: category || undefined,
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
          maxWidth: "420px",
        }}
        onClick={(e) => e.stopPropagation()}
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
          EDITAR GASTO FIXO
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "var(--yellow)",
            marginBottom: "16px",
          }}
        >
          ⚠ A alteração será aplicada a partir de {month}. Meses anteriores não
          serão afetados.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <input
            style={inputStyle}
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Valor"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
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

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "8px",
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
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              padding: "8px",
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
            {loading ? "salvando..." : "SALVAR →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────

export function FixedClient({
  month,
  items,
}: {
  month: string;
  items: FixedItem[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<FixedItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const total = items.reduce((acc, i) => acc + i.value, 0);

  async function handleDelete(id: string) {
    if (!confirm("Remover este gasto fixo a partir deste mês?")) return;
    setDeleting(id);
    await deleteFixed(id, month);
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
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
            GASTOS FIXOS
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
            style={{ fontSize: "20px", color: "var(--red)", fontWeight: "500" }}
          >
            {fmt(total)}
          </p>
        </div>
      </div>

      <AddFixedForm month={month} onAdd={() => router.refresh()} />

      {/* List */}
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
          Nenhum gasto fixo cadastrado para este mês.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text)",
                    marginBottom: "3px",
                  }}
                >
                  {item.title}
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                </div>
              </div>

              <span
                className="mono"
                style={{
                  fontSize: "14px",
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(item.value)}
              </span>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => setEditing(item)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "11px",
                  }}
                >
                  ✎
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
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          item={editing}
          month={month}
          onClose={() => setEditing(null)}
          onSave={() => router.refresh()}
        />
      )}
    </div>
  );
}
