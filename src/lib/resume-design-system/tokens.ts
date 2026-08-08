export const typography = {
  display:  { fontSize: "2.25rem", fontWeight: "700", lineHeight: "1.1",  letterSpacing: "-0.02em" },
  heading:  { fontSize: "1.5rem",  fontWeight: "700", lineHeight: "1.2",  letterSpacing: "-0.01em" },
  section:  { fontSize: "0.6875rem", fontWeight: "700", lineHeight: "1",  letterSpacing: "0.18em", textTransform: "uppercase" as const },
  body:     { fontSize: "0.78125rem", fontWeight: "400", lineHeight: "1.65" },
  label:    { fontSize: "0.75rem",  fontWeight: "600", lineHeight: "1.3" },
  caption:  { fontSize: "0.6875rem", fontWeight: "400", lineHeight: "1.4" },
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
} as const;

export const layout = {
  pageWidth:       "794px",
  marginH:         "32px",
  marginV:         "32px",
  columnGap:       "24px",
  sectionSpacing:  "24px",
  entrySpacing:    "16px",
} as const;

export const colorSchemes = {
  default: {
    primary:   "#111827",
    secondary: "#374151",
    muted:     "#6b7280",
    accent:    "#1e40af",
    border:    "#e5e7eb",
    surface:   "#f9fafb",
  },
  executive: {
    primary:   "#1f2937",
    secondary: "#374151",
    muted:     "#6b7280",
    accent:    "#c9b068",
    border:    "#d1d5db",
    surface:   "#f9fafb",
  },
  minimal: {
    primary:   "#0f172a",
    secondary: "#475569",
    muted:     "#94a3b8",
    accent:    "#475569",
    border:    "#e2e8f0",
    surface:   "#f8fafc",
  },
  tech: {
    primary:   "#c9d1d9",
    secondary: "#8b949e",
    muted:     "#8b949e",
    accent:    "#58a6ff",
    border:    "#30363d",
    surface:   "#161b22",
  },
} as const;

export type ColorScheme = typeof colorSchemes[keyof typeof colorSchemes];
