"use client";

import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  code: string;
}

interface SidebarNavProps {
  navItems: NavItem[];
  prev: string;
  next: string;
  currentMonth: string;
  monthLabel: string;
  userName?: string | null;
}

export function SidebarNav({
  navItems,
  prev,
  next,
  currentMonth,
  monthLabel,
  userName,
}: SidebarNavProps) {
  return (
    <>
      {/* Month navigator */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <p
          className="mono"
          style={{
            fontSize: "10px",
            color: "var(--text-dim)",
            marginBottom: "8px",
            letterSpacing: "0.1em",
          }}
        >
          MÊS ATIVO
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text)",
            fontWeight: "500",
            textTransform: "capitalize",
            marginBottom: "10px",
          }}
        >
          {monthLabel}
        </p>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { href: `/${prev}`, label: "←" },
            { href: `/${currentMonth}`, label: "hoje" },
            { href: `/${next}`, label: "→" },
          ].map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              style={{
                flex: 1,
                padding: "4px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                color: "var(--text-muted)",
                fontSize: "11px",
                textAlign: "center",
                textDecoration: "none",
                fontFamily: "DM Mono, monospace",
              }}
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px" }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px",
              borderRadius: "6px",
              textDecoration: "none",
              color: "var(--text-muted)",
              fontSize: "13px",
              marginBottom: "2px",
              transition: "all 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: "10px",
                color: "var(--text-dim)",
                width: "16px",
              }}
            >
              {item.code}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {userName}
        </p>
      </div>
    </>
  );
}
