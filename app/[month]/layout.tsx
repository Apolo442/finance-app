// import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";

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
    { href: `/${month}/weekly`, label: "Semanas", code: "04" },
    { href: `/${month}/analytics`, label: "Analytics", code: "05" },
  ];

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}
    >
      <aside
        style={{
          width: "220px",
          minHeight: "100vh",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          background: "var(--bg)",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "0 20px 24px",
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

        {/* Sign out — server action */}
        <div style={{ padding: "0 20px 8px" }}>
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

      <main
        style={{
          marginLeft: "220px",
          flex: 1,
          padding: "32px 40px",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
