"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { createMarketplace, deleteMarketplace } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Marketplace {
  id: string;
  name: string;
}

interface MarketplaceResult {
  id: string;
  name: string;
  count: number;
  total: number;
}

interface CategoryResult {
  name: string;
  value: number;
  items: { title: string; value: number }[];
}

interface AnalyticsData {
  month: string;
  byCategory: CategoryResult[]; // <-- Alterado
  byWeek: { name: string; value: number }[];
  byMonthYear: { name: string; value: number }[];
  annualByCategory?: CategoryResult[]; // <-- Alterado
  annualByMarketplace?: MarketplaceResult[];
  byMarketplace: MarketplaceResult[];
  marketplaces: Marketplace[];
  totals: {
    total: number;
    credit: number;
    pix: number;
    reserved: number;
    others: number;
  };
}

const COLORS = [
  "#4ade80",
  "#facc15",
  "#f87171",
  "#60a5fa",
  "#c084fc",
  "#fb923c",
  "#34d399",
  "#a78bfa",
  "#f472b6",
  "#94a3b8",
  "#38bdf8",
  "#fbbf24",
  "#86efac",
  "#fca5a5",
];

const MARKETPLACE_COLORS: Record<string, string> = {
  amazon: "#3b82f6", // Azul
  "mercado livre": "#facc15", // Amarelo
  shopee: "#f97316", // Laranja
  ifood: "#ea1d2c", // Vermelho
  uber: "#a8a29e", // Cinza
};

function getMarketplaceColor(name: string, index: number) {
  const normalizedName = name.toLowerCase().trim();
  return MARKETPLACE_COLORS[normalizedName] || COLORS[index % COLORS.length];
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mono"
      style={{
        fontSize: "10px",
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        marginBottom: "16px",
      }}
    >
      {children}
    </p>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    fontFamily: "DM Mono, monospace",
    fontSize: "12px",
    color: "var(--text)",
  },
  labelStyle: { color: "var(--text-muted)" },
};

function MarketplaceBI({
  byMarketplace,
  marketplaces,
  onRefresh,
}: {
  byMarketplace: MarketplaceResult[];
  marketplaces: Marketplace[];
  onRefresh: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showManage, setShowManage] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    await createMarketplace(newName.trim());
    setNewName("");
    setLoading(false);
    onRefresh();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteMarketplace(id);
    setDeleting(null);
    onRefresh();
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "7px 10px",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "5px",
    color: "var(--text)",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <p
          className="mono"
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
          }}
        >
          DISTRIBUIÇÃO POR MARKETPLACE
        </p>
        <button
          onClick={() => setShowManage((v) => !v)}
          className="mono"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-dim)",
            fontSize: "10px",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          {showManage ? "▲ fechar" : "▼ gerenciar lojas"}
        </button>
      </div>

      {showManage && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: "var(--bg)",
            borderRadius: "6px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              style={inputStyle}
              placeholder="Nome da loja (ex: Shopee)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newName.trim()}
              style={{
                padding: "7px 14px",
                background: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                borderRadius: "5px",
                color: "var(--accent)",
                fontFamily: "DM Mono, monospace",
                fontSize: "11px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                opacity: loading || !newName.trim() ? 0.5 : 1,
              }}
            >
              + ADD
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {marketplaces.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {m.name}
                </span>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deleting === m.id}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-dim)",
                    cursor: "pointer",
                    fontSize: "13px",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  {deleting === m.id ? "·" : "×"}
                </button>
              </div>
            ))}
            {marketplaces.length === 0 && (
              <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                Nenhuma loja cadastrada ainda.
              </p>
            )}
          </div>
        </div>
      )}

      {byMarketplace.length === 0 ? (
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-dim)",
            padding: "8px 0",
          }}
        >
          {marketplaces.length === 0
            ? "Cadastre lojas para começar a rastrear."
            : "Nenhum gasto encontrado para as lojas cadastradas neste mês."}
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byMarketplace.map((item, i) => ({
                  ...item,
                  value: item.total, // Recharts usa a propriedade 'value'
                  fill: getMarketplaceColor(item.name, i),
                }))}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [fmt(Number(value)), ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "8px",
            }}
          >
            {byMarketplace.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "2px",
                      background: getMarketplaceColor(m.name, i),
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {m.name}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: "10px", color: "var(--text-dim)" }}
                  >
                    ({m.count} compra{m.count !== 1 ? "s" : ""})
                  </span>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: "12px", color: "var(--text)" }}
                >
                  {fmt(m.total)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const router = useRouter();
  const [view, setView] = useState<"month" | "year">("month");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const monthLabel = new Date(data.month + "-02")
    .toLocaleDateString("pt-BR", { month: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());
  const hasMonthData = data.totals.total > 0;
  const hasYearData = data.byMonthYear.some((m) => m.value > 0);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "12px",
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
            ANALYTICS
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
              {data.month.split("-")[0]}
            </span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["month", "year"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="mono"
              style={{
                padding: "6px 14px",
                background: view === v ? "var(--accent-dim)" : "var(--bg-card)",
                border: `1px solid ${
                  view === v ? "var(--accent)" : "var(--border)"
                }`,
                borderRadius: "5px",
                color: view === v ? "var(--accent)" : "var(--text-muted)",
                fontSize: "11px",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              {v === "month" ? "MENSAL" : "ANUAL"}
            </button>
          ))}
        </div>
      </div>

      {/* ── MONTHLY VIEW ── */}
      {view === "month" && (
        <>
          {!hasMonthData ? (
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                color: "var(--text-dim)",
                fontSize: "13px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            >
              Nenhum gasto registrado neste mês ainda.
            </div>
          ) : (
            <>
              {/* Totals */}
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                style={{ marginBottom: "24px" }}
              >
                {[
                  {
                    label: "TOTAL GASTO",
                    value: data.totals.total,
                    color: "var(--text)",
                  },
                  {
                    label: "CRÉDITO",
                    value: data.totals.credit,
                    color: "var(--yellow)",
                  },
                  {
                    label: "PIX",
                    value: data.totals.pix,
                    color: "var(--accent)",
                  },
                  {
                    label: "RESERVADO / OUTROS",
                    value: data.totals.reserved + data.totals.others,
                    color: "var(--text-muted)",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      padding: "14px 16px",
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
                        marginBottom: "6px",
                      }}
                    >
                      {card.label}
                    </p>
                    <p
                      className="mono"
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: card.color,
                      }}
                    >
                      {fmt(card.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pizza de Categorias + Pizza de Marketplace (Lado a Lado) */}
              <div
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                style={{ marginBottom: "24px" }}
              >
                {/* Pizza Categoria */}
                <div
                  style={{
                    padding: "20px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  <SectionTitle>DISTRIBUIÇÃO POR CATEGORIA</SectionTitle>
                  {data.byCategory.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                      Sem categorias registradas.
                    </p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={data.byCategory.map((item, i) => ({
                              ...item,
                              fill: COLORS[i % COLORS.length],
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          />
                          <Tooltip
                            {...tooltipStyle}
                            formatter={(value) => [fmt(Number(value)), ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        {data.byCategory.map((cat, i) => (
                          <div
                            key={cat.name}
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <div
                              onClick={() =>
                                setExpandedCat(
                                  expandedCat === cat.name ? null : cat.name,
                                )
                              }
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                                padding: "4px 0",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "2px",
                                    background: COLORS[i % COLORS.length],
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "var(--text-muted)",
                                    transition: "color 0.2s",
                                    userSelect: "none",
                                  }}
                                >
                                  {cat.name}{" "}
                                  {expandedCat === cat.name ? "▾" : "▸"}
                                </span>
                              </div>
                              <span
                                className="mono"
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text)",
                                }}
                              >
                                {fmt(cat.value)}
                              </span>
                            </div>

                            {expandedCat === cat.name && (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  paddingLeft: "12px",
                                  marginTop: "4px",
                                  marginBottom: "8px",
                                  borderLeft: "2px solid var(--border)",
                                  marginLeft: "3px",
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                }}
                              >
                                {cat.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: "12px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--text-dim)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {item.title}
                                    </span>
                                    <span
                                      className="mono"
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--text-dim)",
                                      }}
                                    >
                                      {fmt(item.value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Marketplace BI (Agora como Pizza lado a lado com Categorias) */}
                <MarketplaceBI
                  byMarketplace={data.byMarketplace}
                  marketplaces={data.marketplaces}
                  onRefresh={() => router.refresh()}
                />
              </div>

              {/* Barras Gastos por Semana (Agora Ocupando 100% da Largura abaixo das Pizzas) */}
              <div
                style={{
                  padding: "20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  marginBottom: "24px",
                }}
              >
                <SectionTitle>GASTOS POR SEMANA</SectionTitle>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.byWeek} barSize={32}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "var(--text-muted)",
                        fontSize: 11,
                        fontFamily: "DM Mono",
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fill: "var(--text-dim)",
                        fontSize: 10,
                        fontFamily: "DM Mono",
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${v}`}
                      width={48}
                    />
                    <Tooltip
                      cursor={false}
                      {...tooltipStyle}
                      formatter={(value) => [fmt(Number(value)), ""]}
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--accent)"
                      radius={[4, 4, 0, 0]}
                      cursor="default"
                      activeBar={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      {/* ── ANNUAL VIEW ── */}
      {view === "year" && (
        <>
          {!hasYearData ? (
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                color: "var(--text-dim)",
                fontSize: "13px",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            >
              Nenhum gasto registrado este ano ainda.
            </div>
          ) : (
            <div
              style={{
                padding: "20px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            >
              <SectionTitle>
                EVOLUÇÃO MENSAL — {data.month.split("-")[0]}
              </SectionTitle>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.byMonthYear}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: "var(--text-muted)",
                      fontSize: 11,
                      fontFamily: "DM Mono",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fill: "var(--text-dim)",
                      fontSize: 10,
                      fontFamily: "DM Mono",
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${v}`}
                    width={48}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value) => [fmt(Number(value)), ""]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ fill: "var(--accent)", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "var(--accent)", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div
                style={{
                  marginTop: "20px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "16px",
                }}
              >
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                  {data.byMonthYear.map((m) => (
                    <div key={m.name} style={{ textAlign: "center" }}>
                      <p
                        className="mono"
                        style={{
                          fontSize: "10px",
                          color: "var(--text-dim)",
                          marginBottom: "3px",
                        }}
                      >
                        {m.name}
                      </p>
                      <p
                        className="mono"
                        style={{
                          fontSize: "12px",
                          color:
                            m.value > 0 ? "var(--text)" : "var(--text-dim)",
                        }}
                      >
                        {m.value > 0 ? fmt(m.value) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                style={{ marginTop: "24px" }}
              >
                {/* Pizza Categoria Anual */}
                <div
                  style={{
                    padding: "20px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  <SectionTitle>DISTRIBUIÇÃO ANUAL POR CATEGORIA</SectionTitle>
                  {!data.annualByCategory ||
                  data.annualByCategory.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                      Sem categorias registradas no ano.
                    </p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={data.annualByCategory.map((item, i) => ({
                              ...item,
                              fill: COLORS[i % COLORS.length],
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          />
                          <Tooltip
                            {...tooltipStyle}
                            formatter={(value) => [fmt(Number(value)), ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        {/*  */}
                        {data.annualByCategory.map((cat, i) => (
                          <div
                            key={cat.name}
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <div
                              onClick={() =>
                                setExpandedCat(
                                  expandedCat === cat.name ? null : cat.name,
                                )
                              }
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "pointer",
                                padding: "4px 0",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "2px",
                                    background: COLORS[i % COLORS.length],
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "var(--text-muted)",
                                    transition: "color 0.2s",
                                    userSelect: "none",
                                  }}
                                >
                                  {cat.name}{" "}
                                  {expandedCat === cat.name ? "▾" : "▸"}
                                </span>
                              </div>
                              <span
                                className="mono"
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text)",
                                }}
                              >
                                {fmt(cat.value)}
                              </span>
                            </div>

                            {expandedCat === cat.name && (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  paddingLeft: "12px",
                                  marginTop: "4px",
                                  marginBottom: "8px",
                                  borderLeft: "2px solid var(--border)",
                                  marginLeft: "3px",
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                }}
                              >
                                {cat.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: "12px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--text-dim)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {item.title}
                                    </span>
                                    <span
                                      className="mono"
                                      style={{
                                        fontSize: "11px",
                                        color: "var(--text-dim)",
                                      }}
                                    >
                                      {fmt(item.value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Pizza Marketplace Anual */}
                <div
                  style={{
                    padding: "20px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  <SectionTitle>
                    DISTRIBUIÇÃO ANUAL POR MARKETPLACE
                  </SectionTitle>
                  {!data.annualByMarketplace ||
                  data.annualByMarketplace.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                      Sem marketplaces registrados no ano.
                    </p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={data.annualByMarketplace.map((item, i) => ({
                              ...item,
                              value: item.total,
                              fill: getMarketplaceColor(item.name, i),
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          />
                          <Tooltip
                            {...tooltipStyle}
                            formatter={(value) => [fmt(Number(value)), ""]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        {data.annualByMarketplace.map((m, i) => (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "2px",
                                  background: getMarketplaceColor(m.name, i),
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {m.name}
                              </span>
                              <span
                                className="mono"
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-dim)",
                                }}
                              >
                                ({m.count} compras)
                              </span>
                            </div>
                            <span
                              className="mono"
                              style={{ fontSize: "12px", color: "var(--text)" }}
                            >
                              {fmt(m.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
