"use client";

import { useTheme } from "@/lib/theme-context";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      style={{
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "5px 10px",
        cursor: "pointer",
        color: "var(--text-muted)",
        fontSize: "14px",
        lineHeight: 1,
        transition: "all 0.15s",
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
