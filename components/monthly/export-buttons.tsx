"use client";

import { useState } from "react";
import type jsPDF from "jspdf";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

interface ReportData {
  month: string;
  budget: {
    incomeTotal: number;
    reserveAmount: number;
    totalFixed: number;
    totalInstallments: number;
    netRemainder: number;
    weeklyAllocation: number;
  };
  fixed: {
    title: string;
    value: number;
    bank: string;
    category: string | null;
  }[];
  installments: {
    title: string;
    value: number;
    bank: string;
    category: string | null;
    currentInstallment: number;
    totalInstallments: number;
  }[];
  weeklyByWeek: {
    week: number;
    total: number;
    expenses: {
      title: string;
      value: number;
      type: string;
      bank: string | null;
      category: string | null;
      date: string | null;
    }[];
  }[];
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const BANK_LABELS: Record<string, string> = {
  NUBANK: "Nubank",
  MERCADO_PAGO: "Mercado Pago",
};
const TYPE_LABELS: Record<string, string> = {
  CREDITO: "Crédito",
  PIX: "PIX",
  RESERVADO: "Reservado",
  OUTROS: "Outros",
};
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

async function fetchReport(month: string): Promise<ReportData> {
  const res = await fetch(`/api/finance/report?month=${month}`);
  return res.json();
}

async function exportXLSX(data: ReportData) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // ── Composição ──
  const compRows = [
    ["COMPOSIÇÃO DO MÊS", ""],
    ["Entrada", data.budget.incomeTotal],
    ["Reserva", data.budget.reserveAmount],
    ["Gastos Fixos", data.budget.totalFixed],
    ["Parcelamentos", data.budget.totalInstallments],
    ["Saldo Livre", data.budget.netRemainder],
    ["Gasto Semanal", data.budget.weeklyAllocation],
  ];
  const wsComp = XLSX.utils.aoa_to_sheet(compRows);
  wsComp["!cols"] = [{ wch: 22 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsComp, "Composição");

  // ── Gastos Fixos ──
  const fixedRows = [
    ["TÍTULO", "BANCO", "CATEGORIA", "VALOR"],
    ...data.fixed.map((f) => [
      f.title,
      BANK_LABELS[f.bank] ?? f.bank,
      f.category ?? "",
      f.value,
    ]),
    ["", "", "TOTAL", data.fixed.reduce((a, f) => a + f.value, 0)],
  ];
  const wsFixed = XLSX.utils.aoa_to_sheet(fixedRows);
  wsFixed["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsFixed, "Gastos Fixos");

  // ── Parcelamentos ──
  const instRows = [
    ["TÍTULO", "PARCELA", "BANCO", "CATEGORIA", "VALOR"],
    ...data.installments.map((i) => [
      i.title,
      `${i.currentInstallment}/${i.totalInstallments}`,
      BANK_LABELS[i.bank] ?? i.bank,
      i.category ?? "",
      i.value,
    ]),
    ["", "", "", "TOTAL", data.installments.reduce((a, i) => a + i.value, 0)],
  ];
  const wsInst = XLSX.utils.aoa_to_sheet(instRows);
  wsInst["!cols"] = [
    { wch: 28 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInst, "Parcelamentos");

  // ── Semanas ──
  for (const w of data.weeklyByWeek) {
    const rows = [
      [`SEMANA ${w.week}`, "", "", "", "", ""],
      ["DATA", "TÍTULO", "TIPO", "BANCO", "CATEGORIA", "VALOR"],
      ...w.expenses.map((e) => [
        e.date ?? "",
        e.title,
        TYPE_LABELS[e.type] ?? e.type,
        e.bank ? (BANK_LABELS[e.bank] ?? e.bank) : "",
        e.category ?? "",
        e.value,
      ]),
      ["", "", "", "", "TOTAL", w.total],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 28 },
      { wch: 10 },
      { wch: 14 },
      { wch: 20 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, `Semana ${w.week}`);
  }

  XLSX.writeFile(wb, `relatorio-${data.month}.xlsx`);
}

async function exportPDF(data: ReportData, monthLabel: string) {
  const { default: jsPDFClass } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDFClass({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as jsPDFWithAutoTable;

  const PRIMARY: [number, number, number] = [22, 163, 74];
  const DARK: [number, number, number] = [20, 20, 20];
  const MUTED: [number, number, number] = [120, 120, 120];
  const LIGHT_BG: [number, number, number] = [245, 245, 245];
  const WHITE: [number, number, number] = [255, 255, 255];

  let y = 18;

  function addPageHeader() {
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text("GESTOR FINANCEIRO", 14, 8);
    doc.text(monthLabel.toUpperCase(), 196, 8, { align: "right" });
  }

  function sectionTitle(text: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(text, 14, y);
    y += 6;
  }

  addPageHeader();
  y = 22;

  // ── Título ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text(monthLabel, 14, y);
  y += 8;

  // ── Composição ──
  sectionTitle("COMPOSIÇÃO DO MÊS");
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["", "VALOR"]],
    body: [
      ["Entrada", fmt(data.budget.incomeTotal)],
      ["Reserva", fmt(data.budget.reserveAmount)],
      ["Gastos Fixos", fmt(data.budget.totalFixed)],
      ["Parcelamentos", fmt(data.budget.totalInstallments)],
      ["Saldo Livre", fmt(data.budget.netRemainder)],
      ["Gasto Semanal (÷4)", fmt(data.budget.weeklyAllocation)],
    ],
    theme: "grid",
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: "right" },
    },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Gastos Fixos ──
  if (y > 220) {
    doc.addPage();
    addPageHeader();
    y = 22;
  }
  sectionTitle("GASTOS FIXOS");
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["TÍTULO", "BANCO", "CATEGORIA", "VALOR"]],
    body: [
      ...data.fixed.map((f) => [
        f.title,
        BANK_LABELS[f.bank] ?? f.bank,
        f.category ?? "—",
        fmt(f.value),
      ]),
      [
        {
          content: "TOTAL",
          colSpan: 3,
          styles: { fontStyle: "bold", halign: "right" },
        },
        { content: fmt(data.budget.totalFixed), styles: { fontStyle: "bold" } },
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: { fontSize: 8.5, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: { 3: { halign: "right" } },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Parcelamentos ──
  if (y > 220) {
    doc.addPage();
    addPageHeader();
    y = 22;
  }
  sectionTitle("PARCELAMENTOS");
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [["TÍTULO", "PARCELA", "BANCO", "CATEGORIA", "VALOR"]],
    body: [
      ...data.installments.map((i) => [
        i.title,
        `${i.currentInstallment}/${i.totalInstallments}`,
        BANK_LABELS[i.bank] ?? i.bank,
        i.category ?? "—",
        fmt(i.value),
      ]),
      [
        {
          content: "TOTAL",
          colSpan: 4,
          styles: { fontStyle: "bold", halign: "right" },
        },
        {
          content: fmt(data.budget.totalInstallments),
          styles: { fontStyle: "bold" },
        },
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: { fontSize: 8.5, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: { 4: { halign: "right" } },
  });
  y = doc.lastAutoTable.finalY + 10;

  // ── Semanas ──
  for (const w of data.weeklyByWeek) {
    if (y > 220) {
      doc.addPage();
      addPageHeader();
      y = 22;
    }
    sectionTitle(`SEMANA ${w.week}`);
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      head: [["DATA", "TÍTULO", "TIPO", "BANCO", "CATEGORIA", "VALOR"]],
      body:
        w.expenses.length === 0
          ? [
              [
                {
                  content: "Nenhum gasto registrado",
                  colSpan: 6,
                  styles: { textColor: MUTED, halign: "center" },
                },
              ],
            ]
          : [
              ...w.expenses.map((e) => [
                e.date ?? "—",
                e.title,
                TYPE_LABELS[e.type] ?? e.type,
                e.bank ? (BANK_LABELS[e.bank] ?? e.bank) : "—",
                e.category ?? "—",
                fmt(e.value),
              ]),
              [
                {
                  content: "TOTAL",
                  colSpan: 5,
                  styles: { fontStyle: "bold", halign: "right" },
                },
                { content: fmt(w.total), styles: { fontStyle: "bold" } },
              ],
            ],
      theme: "grid",
      headStyles: {
        fillColor: [50, 50, 50] as [number, number, number],
        textColor: WHITE,
        fontSize: 8,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 8.5, textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 5: { halign: "right" } },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── Rodapé com número de páginas ──
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: "right" });
  }

  doc.save(`relatorio-${data.month}.pdf`);
}

export function ExportButtons({ month }: { month: string }) {
  const [loading, setLoading] = useState<"pdf" | "xlsx" | null>(null);

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `${MONTH_NAMES[m - 1]} ${y}`;

  async function handle(format: "pdf" | "xlsx") {
    setLoading(format);
    try {
      const data = await fetchReport(month);
      if (format === "xlsx") await exportXLSX(data);
      else await exportPDF(data, monthLabel);
    } finally {
      setLoading(null);
    }
  }

  const btnStyle = (f: "pdf" | "xlsx"): React.CSSProperties => ({
    padding: "6px 14px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "5px",
    color: loading === f ? "var(--accent)" : "var(--text-muted)",
    fontFamily: "DM Mono, monospace",
    fontSize: "11px",
    cursor: loading ? "default" : "pointer",
    letterSpacing: "0.05em",
    opacity: loading && loading !== f ? 0.4 : 1,
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <button
        onClick={() => handle("pdf")}
        disabled={!!loading}
        style={btnStyle("pdf")}
      >
        {loading === "pdf" ? "gerando..." : "↓ PDF"}
      </button>
      <button
        onClick={() => handle("xlsx")}
        disabled={!!loading}
        style={btnStyle("xlsx")}
      >
        {loading === "xlsx" ? "gerando..." : "↓ XLSX"}
      </button>
    </div>
  );
}
