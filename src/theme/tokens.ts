export const colors = {
  brand: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  success: { main: "#22c55e", light: "#dcfce7", dark: "#15803d" },
  warning: { main: "#f59e0b", light: "#fef3c7", dark: "#b45309" },
  error: { main: "#ef4444", light: "#fee2e2", dark: "#b91c1c" },
  info: { main: "#06b6d4", light: "#cffafe", dark: "#0e7490" },
} as const;

export const typography = {
  fonts: {
    heading: "'Sora', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
  },
} as const;
