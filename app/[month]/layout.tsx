import { auth, signOut } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { ExportButtons } from "@/components/monthly/export-buttons";

function getMonthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getAdjacentMonths(month: string) {
  const [year, m] = month.split("-").map(Number);
  const prev = new Date(year, m - 2);
  const next = new Date(year, m);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return { prev: fmt(prev), next: fmt(next) };
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const session = await auth();
  const { prev, next } = getAdjacentMonths(month);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const navItems = [
    { href: `/${month}`, label: "Visão Geral", code: "01" },
    { href: `/${month}/fixed`, label: "Gastos Fixos", code: "02" },
    { href: `/${month}/installments`, label: "Parcelamentos", code: "03" },
    { href: `/${month}/analytics`, label: "Analytics", code: "04" },
  ];
  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}
    >
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex"
        style={{
          width: "220px",
          minHeight: "100vh",
          borderRight: "1px solid var(--border)",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          background: "var(--bg)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 6px var(--accent)",
              }}
            />
            <span
              className="mono"
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
              }}
            >
              GESTOR FIN.
            </span>
          </div>
        </div>

        <SidebarNav
          navItems={navItems}
          prev={prev}
          next={next}
          currentMonth={currentMonth}
          monthLabel={getMonthLabel(month)}
          userName={session?.user?.name}
        />

        <div style={{ padding: "0 20px 16px" }}>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="mono"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-dim)",
                fontSize: "11px",
                cursor: "pointer",
                letterSpacing: "0.05em",
                padding: 0,
              }}
            >
              sair →
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile drawer (hamburger inside SidebarNav) ── */}
      <div className="lg:hidden">
        <SidebarNav
          navItems={navItems}
          prev={prev}
          next={next}
          currentMonth={currentMonth}
          monthLabel={getMonthLabel(month)}
          userName={session?.user?.name}
        />
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* padding-top: 64px no mobile para não ficar sob o hamburger */}
        {/* margin-left: 220px no desktop para não ficar sob a sidebar */}
        <style>{`
          @media (max-width: 1023px) {
            .page-content { padding: 64px 16px 32px 16px; }
          }
          @media (min-width: 1024px) {
            .page-content { margin-left: 220px; padding: 32px 40px; }
          }
        `}</style>
        <div className="page-content">
          {/* Botão de Exportação no topo */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "24px",
            }}
          >
            <ExportButtons month={month} />
          </div>
          {children}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "20px",
            }}
          ></div>
        </div>
      </main>
    </div>
  );
}
