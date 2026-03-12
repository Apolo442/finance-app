"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

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
  const [open, setOpen] = useState(false);

  const inner = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
              key={`${btn.label}-${btn.href}`}
              href={btn.href}
              onClick={() => setOpen(false)}
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

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px" }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 8px",
              borderRadius: "6px",
              textDecoration: "none",
              color: "var(--text-muted)",
              fontSize: "14px",
              marginBottom: "2px",
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

      {/* User + Theme */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            marginRight: "8px",
          }}
        >
          {userName}
        </p>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar content */}
      <div
        className="hidden lg:flex"
        style={{ flexDirection: "column", height: "100%" }}
      >
        {inner}
      </div>

      {/* Mobile: hamburger button */}
      <button
        className="lg:hidden"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 200,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "8px 10px",
          cursor: "pointer",
          color: "var(--text)",
          fontSize: "16px",
          lineHeight: 1,
        }}
      >
        ☰
      </button>

      {/* Mobile: overlay */}
      {open && (
        <div
          className="lg:hidden"
          style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex" }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
            }}
          />
          {/* Drawer */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "260px",
              background: "var(--bg)",
              borderRight: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Close button */}
            <div
              style={{
                padding: "16px 20px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
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
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>
            {inner}
          </div>
        </div>
      )}
    </>
  );
}
