export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    muted: string;
    border: string;
    cardBg: string;
    sectionTitle: string;
  };
  headerStyle: "centered" | "left-bar" | "top-banner";
  font: "sans" | "serif" | "modern";
  spacing: "compact" | "standard" | "spacious";
  preview: string; // emoji icon for template picker
}

const baseColors = [
  {
    key: "ocean",
    label: "Ocean",
    emoji: "🌊",
    colors: {
      primary: "#06b6d4",
      secondary: "#0ea5e9",
      accent: "#0284c7",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#06b6d4",
    },
  },
  {
    key: "emerald",
    label: "Emerald",
    emoji: "💚",
    colors: {
      primary: "#10b981",
      secondary: "#059669",
      accent: "#047857",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#10b981",
    },
  },
  {
    key: "royal",
    label: "Royal",
    emoji: "💜",
    colors: {
      primary: "#8b5cf6",
      secondary: "#7c3aed",
      accent: "#6d28d9",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#8b5cf6",
    },
  },
  {
    key: "sunset",
    label: "Sunset",
    emoji: "🌅",
    colors: {
      primary: "#f43f5e",
      secondary: "#e11d48",
      accent: "#be123c",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#f43f5e",
    },
  },
  {
    key: "forest",
    label: "Forest",
    emoji: "🌲",
    colors: {
      primary: "#22c55e",
      secondary: "#16a34a",
      accent: "#15803d",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#22c55e",
    },
  },
  {
    key: "midnight",
    label: "Midnight",
    emoji: "🌙",
    colors: {
      primary: "#6366f1",
      secondary: "#4f46e5",
      accent: "#4338ca",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#6366f1",
    },
  },
  {
    key: "ruby",
    label: "Ruby",
    emoji: "❤️",
    colors: {
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#991b1b",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#dc2626",
    },
  },
  {
    key: "amber",
    label: "Amber",
    emoji: "🌟",
    colors: {
      primary: "#f59e0b",
      secondary: "#d97706",
      accent: "#b45309",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#f59e0b",
    },
  },
  {
    key: "sky",
    label: "Sky",
    emoji: "☀️",
    colors: {
      primary: "#0ea5e9",
      secondary: "#0284c7",
      accent: "#0369a1",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#0ea5e9",
    },
  },
  {
    key: "graphite",
    label: "Graphite",
    emoji: "⚙️",
    colors: {
      primary: "#475569",
      secondary: "#334155",
      accent: "#1e293b",
      bg: "#ffffff",
      text: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      cardBg: "#f8fafc",
      sectionTitle: "#475569",
    },
  },
];

const headerStyles = [
  { key: "centered", label: "Centered", desc: "Clean centered header" },
  { key: "left-bar", label: "Left Bar", desc: "Bold left accent bar" },
  { key: "top-banner", label: "Banner", desc: "Full-width colored banner" },
] as const;

const fonts = [
  { key: "sans", label: "Modern Sans", family: "'Inter', 'Segoe UI', sans-serif" },
  { key: "serif", label: "Classic Serif", family: "'Merriweather', 'Georgia', serif" },
  { key: "modern", label: "Professional", family: "'SF Pro Display', 'Helvetica Neue', sans-serif" },
] as const;

const spacings = [
  { key: "compact", label: "Compact" },
  { key: "standard", label: "Standard" },
  { key: "spacious", label: "Spacious" },
] as const;

function generateTemplates(): ResumeTemplate[] {
  const templates: ResumeTemplate[] = [];
  let id = 1;

  for (const base of baseColors) {
    for (const hStyle of headerStyles) {
      const font = hStyle.key === "centered" ? "sans" : hStyle.key === "left-bar" ? "modern" : "serif";
      const spacing = hStyle.key === "centered" ? "standard" : hStyle.key === "left-bar" ? "compact" : "spacious";

      const styleLabel = hStyle.key === "centered" ? "" : hStyle.key === "left-bar" ? "Pro " : "Banner ";
      templates.push({
        id: `template-${id}`,
        name: `${styleLabel}${base.label}`,
        description: `${hStyle.label} layout with ${base.label} color scheme`,
        colors: { ...base.colors },
        headerStyle: hStyle.key as ResumeTemplate["headerStyle"],
        font: font as ResumeTemplate["font"],
        spacing: spacing as ResumeTemplate["spacing"],
        preview: base.emoji,
      });
      id++;
    }
  }

  return templates;
}

export const TEMPLATES = generateTemplates();

export const TEMPLATE_FONTS: Record<string, string> = {
  sans: "'Inter', 'Segoe UI', sans-serif",
  serif: "'Merriweather', 'Georgia', serif",
  modern: "'SF Pro Display', 'Helvetica Neue', sans-serif",
};
