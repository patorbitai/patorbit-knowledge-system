import { TEMPLATES } from "@/app/resume-builder/templates";
import { fontFamilies } from "./fonts";

/* ────────────────────────────────────────────────────────────────────────────
 * ResumeStyleConfig — centralized, content-free visual styling.
 *
 * Style settings live SEPARATELY from resume content (the store keeps one
 * config per resumeId). They are applied at the render seam (StyleScope →
 * ResumePreview) via CSS custom properties, so templates keep working with
 * their native design unless the user actively diverges from the platform
 * defaults (which match the design system's ATS-safe baseline).
 *
 * Only curated options are exposed — no arbitrary CSS input. Each template
 * declares which options it supports (see getTemplateStyleSupport); options
 * that would fight a template's structural layout are hidden in the panel.
 * ──────────────────────────────────────────────────────────────────────────── */

export type HeadingStyle = "uppercase" | "title-case" | "normal";
export type HeadingWeight = "auto" | "semibold" | "bold";
export type BulletStyle = "bullet" | "circle" | "dash" | "square";
export type BulletSize = "auto" | "small" | "normal";
export type Density = "comfortable" | "compact";
export type SectionTitleStyle = "underline" | "uppercase" | "bold" | "minimal";
export type ContactLayout = "inline" | "stacked" | "grid";
export type DividerStyle = "none" | "line" | "dots" | "gradient";
export type SkillPresentation = "tags" | "list" | "pills" | "inline";
export type DateFormat = "mm-yyyy" | "month-year" | "short-month" | "year-only";

export interface ResumeStyleConfig {
  /** Curated font id (must map to a font actually loaded via next/font). */
  fontFamily: string;
  /** Sheet-wide type scale: 0.9 | 1 | 1.1 */
  fontScale: number;
  /** Body line height: 1.4 | 1.6 | 1.8 */
  lineHeight: number;
  accentColor: string;
  headingColor: string;
  bodyColor: string;
  headingStyle: HeadingStyle;
  /** "auto" = template's native weight (emits no override). */
  headingWeight: HeadingWeight;
  bulletStyle: BulletStyle;
  /** "auto" = template's native bullet size (emits no override). */
  bulletSize: BulletSize;
  /** Density presets map onto sectionSpacing / entrySpacing. */
  density: Density;
  /** Vertical gap between sections, px. */
  sectionSpacing: number;
  /** Vertical gap between entries within a section, px. */
  entrySpacing: number;
  /** Page margin (content padding), px. */
  pageMargin: number;
  /** Section title style */
  sectionTitleStyle: SectionTitleStyle;
  /** Contact info layout */
  contactLayout: ContactLayout;
  /** Divider style between sections */
  dividerStyle: DividerStyle;
  /** How skills are presented */
  skillPresentation: SkillPresentation;
  /** Date format */
  dateFormat: DateFormat;
}

export type StyleOptionKey = keyof ResumeStyleConfig;

/* ── Curated option sets (ATS-safe, loaded resources only) ── */

export const FONT_OPTIONS: { id: string; name: string; stack: string; category: string }[] = [
  { id: "jakarta",  name: "Plus Jakarta Sans", stack: fontFamilies.jakarta,  category: "Sans-serif" },
  { id: "inter",    name: "Inter",             stack: fontFamilies.sans,     category: "Sans-serif" },
  { id: "playfair", name: "Playfair Display",  stack: fontFamilies.playfair, category: "Serif" },
  { id: "garamond", name: "EB Garamond",       stack: fontFamilies.garamond, category: "Serif" },
  { id: "mono",     name: "JetBrains Mono",    stack: fontFamilies.mono,     category: "Monospace" },
];

export const FONT_SCALE_OPTIONS = [0.9, 1, 1.1] as const;
export const LINE_HEIGHT_OPTIONS = [1.4, 1.6, 1.8] as const;

export const ACCENT_COLOR_OPTIONS = [
  { value: "#0ea5e9", name: "Patorbit Blue" },
  { value: "#1e3a8a", name: "Navy" },
  { value: "#475569", name: "Slate" },
  { value: "#059669", name: "Emerald" },
  { value: "#7f1d1d", name: "Burgundy" },
  { value: "#111827", name: "Black" },
];

/* Heading color selectors. The platform default is the sentinel `ink` — a
 * config whose headingColor is `ink` emits no override (native template
 * headings). An explicit choice — `accent` ("Same as accent") or the ink hex —
 * always differs from the sentinel, so the override reliably takes effect. */
export const HEADING_COLOR_ACCENT = "accent";
export const HEADING_COLOR_INK = "ink";
export const HEADING_INK_HEX = "#0f172a";

export const HEADING_COLOR_OPTIONS: { value: string; name: string }[] = [
  { value: HEADING_COLOR_ACCENT, name: "Same as accent" },
  { value: HEADING_INK_HEX, name: "Dark/ink" },
];

export const BODY_COLOR_OPTIONS = [
  { value: "#374151", name: "Slate" },
  { value: "#475569", name: "Slate Blue" },
  { value: "#4b5563", name: "Gray" },
  { value: "#6b7280", name: "Muted" },
];

export const HEADING_STYLE_OPTIONS: { value: HeadingStyle; name: string }[] = [
  { value: "uppercase",  name: "Uppercase" },
  { value: "title-case", name: "Title Case" },
  { value: "normal",     name: "Normal" },
];

export const HEADING_WEIGHT_OPTIONS: { value: Exclude<HeadingWeight, "auto">; name: string; css: number }[] = [
  { value: "semibold", name: "Semibold", css: 600 },
  { value: "bold",     name: "Bold",     css: 700 },
];

export const BULLET_STYLE_OPTIONS: { value: BulletStyle; name: string; glyph: string }[] = [
  { value: "bullet", name: "Bullet",  glyph: "•" },
  { value: "circle", name: "Circle",  glyph: "○" },
  { value: "dash",   name: "Dash",    glyph: "–" },
  { value: "square", name: "Square",  glyph: "▪" },
];

export const BULLET_SIZE_OPTIONS: { value: Exclude<BulletSize, "auto">; name: string; css: string }[] = [
  { value: "small",  name: "Small",  css: "0.72em" },
  { value: "normal", name: "Normal", css: "1em" },
];

export const DENSITY_OPTIONS: { value: Density; name: string; section: number; entry: number }[] = [
  { value: "comfortable", name: "Comfortable", section: 32, entry: 20 },
  { value: "compact",     name: "Compact",     section: 16, entry: 8 },
];

/* Curated spacing tiers — every value is ATS-safe and falls inside the
 * clamp bounds below. The config stores px; the panel presents tiers. */
export const SECTION_SPACING_TIERS = [
  { value: "tight",    name: "Tight",    px: 16 },
  { value: "normal",   name: "Normal",   px: 24 },
  { value: "spacious", name: "Spacious", px: 32 },
] as const;

export const ENTRY_SPACING_TIERS = [
  { value: "tight",    name: "Tight",    px: 8 },
  { value: "normal",   name: "Normal",   px: 16 },
  { value: "spacious", name: "Spacious", px: 20 },
] as const;

export const PAGE_MARGIN_TIERS = [
  { value: "narrow", name: "Narrow", px: 24 },
  { value: "normal", name: "Normal", px: 40 },
  { value: "wide",   name: "Wide",   px: 48 },
] as const;

export type SectionSpacingTier = (typeof SECTION_SPACING_TIERS)[number]["value"];
export type EntrySpacingTier = (typeof ENTRY_SPACING_TIERS)[number]["value"];
export type PageMarginTier = (typeof PAGE_MARGIN_TIERS)[number]["value"];

/* ── New style options ── */

export const SECTION_TITLE_STYLE_OPTIONS: { value: SectionTitleStyle; name: string }[] = [
  { value: "underline", name: "Underline" },
  { value: "uppercase", name: "Uppercase" },
  { value: "bold",      name: "Bold" },
  { value: "minimal",   name: "Minimal" },
];

export const CONTACT_LAYOUT_OPTIONS: { value: ContactLayout; name: string }[] = [
  { value: "inline",  name: "Inline" },
  { value: "stacked", name: "Stacked" },
  { value: "grid",    name: "Grid" },
];

export const DIVIDER_STYLE_OPTIONS: { value: DividerStyle; name: string; glyph: string }[] = [
  { value: "none",     name: "None",     glyph: "—" },
  { value: "line",     name: "Line",     glyph: "─" },
  { value: "dots",     name: "Dots",     glyph: "···" },
  { value: "gradient", name: "Gradient", glyph: "▓" },
];

export const SKILL_PRESENTATION_OPTIONS: { value: SkillPresentation; name: string }[] = [
  { value: "tags",   name: "Tags" },
  { value: "list",   name: "List" },
  { value: "pills",  name: "Pills" },
  { value: "inline", name: "Inline" },
];

export const DATE_FORMAT_OPTIONS: { value: DateFormat; name: string }[] = [
  { value: "mm-yyyy",    name: "MM/YYYY" },
  { value: "month-year", name: "Month YYYY" },
  { value: "short-month", name: "Mon YYYY" },
  { value: "year-only",  name: "YYYY" },
];

/** Resolve the tier whose px matches a stored config value (falls back to "normal"). */
export function spacingTier<T extends { px: number; name: string }>(tiers: readonly T[], px: number): T {
  return tiers.find((t) => t.px === px) ?? tiers.find((t) => t.name === "Normal") ?? tiers[0];
}

/* ── ATS-safe clamping bounds ── */

export const ATS_SAFE = {
  minFontScale: 0.9,
  maxFontScale: 1.1,
  minLineHeight: 1.4,
  maxLineHeight: 1.8,
  minSectionSpacing: 16,
  maxSectionSpacing: 32,
  minEntrySpacing: 8,
  maxEntrySpacing: 20,
  minPageMargin: 24,
  maxPageMargin: 48,
} as const;

/* ── Defaults — the platform baseline. Equal to the design system tokens, so a
 *    config identical to DEFAULT emits NO overrides and every template renders
 *    exactly as designed. "Reset to Template Defaults" = restore this. ── */

export const DEFAULT_STYLE_CONFIG: ResumeStyleConfig = {
  fontFamily: "inter",
  fontScale: 1,
  lineHeight: 1.6,
  accentColor: "#0ea5e9",
  headingColor: HEADING_COLOR_INK,
  bodyColor: "#374151",
  headingStyle: "normal",
  headingWeight: "auto",
  bulletStyle: "bullet",
  bulletSize: "auto",
  density: "comfortable",
  sectionSpacing: 24,
  entrySpacing: 16,
  pageMargin: 40,
  sectionTitleStyle: "underline",
  contactLayout: "inline",
  dividerStyle: "line",
  skillPresentation: "tags",
  dateFormat: "mm-yyyy",
};

/* ── Per-template capability map ──
 *  Layout-driven exclusions are derived from the template registry's `layout`
 *  field; the override map handles special cases (mono / dark themes). */

const LAYOUTS_WITHOUT_PAGE_MARGIN = new Set(["two-column", "sidebar-right", "banner", "compact"]);
const DARK_THEME_TEMPLATES = new Set(["dark-elegance", "gradient-flow"]);
const MONO_TEMPLATES = new Set(["tech-mono"]);

const ALL_OPTIONS: StyleOptionKey[] = [
  "fontFamily", "fontScale", "lineHeight",
  "accentColor", "headingColor", "bodyColor",
  "headingStyle", "headingWeight", "bulletStyle", "bulletSize",
  "density", "sectionSpacing", "entrySpacing", "pageMargin",
  "sectionTitleStyle", "contactLayout", "dividerStyle", "skillPresentation", "dateFormat",
];

export function getTemplateStyleSupport(templateId: string): Set<StyleOptionKey> {
  const supported = new Set<StyleOptionKey>(ALL_OPTIONS);
  const template = TEMPLATES.find((t) => t.id === templateId);

  if (template && LAYOUTS_WITHOUT_PAGE_MARGIN.has(template.layout)) {
    // Sidebar / multi-column / banner structures own their inner padding —
    // overriding the sheet's content padding would break the layout.
    supported.delete("pageMargin");
  }
  if (DARK_THEME_TEMPLATES.has(templateId)) {
    // Dark sheets use light-on-dark text; swapping in light-on-light colors
    // would destroy readability.
    supported.delete("accentColor");
    supported.delete("headingColor");
    supported.delete("bodyColor");
  }
  if (MONO_TEMPLATES.has(templateId)) {
    // Monospace is the template's identity; swapping fonts or case styles
    // would defeat its purpose.
    supported.delete("fontFamily");
    supported.delete("headingStyle");
    supported.delete("accentColor");
    supported.delete("headingColor");
    supported.delete("bodyColor");
  }
  return supported;
}

/* ── Resolution: merge user config over defaults and clamp to ATS-safe ranges ── */

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function resolveStyleConfig(config?: Partial<ResumeStyleConfig>): ResumeStyleConfig {
  const merged: ResumeStyleConfig = { ...DEFAULT_STYLE_CONFIG, ...config };
  return {
    ...merged,
    fontFamily: FONT_OPTIONS.some((f) => f.id === merged.fontFamily) ? merged.fontFamily : DEFAULT_STYLE_CONFIG.fontFamily,
    fontScale: clampNumber(merged.fontScale, ATS_SAFE.minFontScale, ATS_SAFE.maxFontScale, DEFAULT_STYLE_CONFIG.fontScale),
    lineHeight: clampNumber(merged.lineHeight, ATS_SAFE.minLineHeight, ATS_SAFE.maxLineHeight, DEFAULT_STYLE_CONFIG.lineHeight),
    accentColor: /^#[0-9a-fA-F]{6}$/.test(merged.accentColor) ? merged.accentColor : DEFAULT_STYLE_CONFIG.accentColor,
    headingColor: merged.headingColor === HEADING_COLOR_ACCENT || merged.headingColor === HEADING_COLOR_INK || /^#[0-9a-fA-F]{6}$/.test(merged.headingColor)
      ? merged.headingColor
      : DEFAULT_STYLE_CONFIG.headingColor,
    bodyColor: /^#[0-9a-fA-F]{6}$/.test(merged.bodyColor) ? merged.bodyColor : DEFAULT_STYLE_CONFIG.bodyColor,
    headingStyle: HEADING_STYLE_OPTIONS.some((o) => o.value === merged.headingStyle) ? merged.headingStyle : DEFAULT_STYLE_CONFIG.headingStyle,
    headingWeight: merged.headingWeight === "auto" || HEADING_WEIGHT_OPTIONS.some((o) => o.value === merged.headingWeight) ? merged.headingWeight : DEFAULT_STYLE_CONFIG.headingWeight,
    bulletStyle: BULLET_STYLE_OPTIONS.some((o) => o.value === merged.bulletStyle) ? merged.bulletStyle : DEFAULT_STYLE_CONFIG.bulletStyle,
    bulletSize: merged.bulletSize === "auto" || BULLET_SIZE_OPTIONS.some((o) => o.value === merged.bulletSize) ? merged.bulletSize : DEFAULT_STYLE_CONFIG.bulletSize,
    density: DENSITY_OPTIONS.some((o) => o.value === merged.density) ? merged.density : DEFAULT_STYLE_CONFIG.density,
    sectionSpacing: clampNumber(merged.sectionSpacing, ATS_SAFE.minSectionSpacing, ATS_SAFE.maxSectionSpacing, DEFAULT_STYLE_CONFIG.sectionSpacing),
    entrySpacing: clampNumber(merged.entrySpacing, ATS_SAFE.minEntrySpacing, ATS_SAFE.maxEntrySpacing, DEFAULT_STYLE_CONFIG.entrySpacing),
    pageMargin: clampNumber(merged.pageMargin, ATS_SAFE.minPageMargin, ATS_SAFE.maxPageMargin, DEFAULT_STYLE_CONFIG.pageMargin),
  };
}

/* ── Effective heading hex ──
 * The config's headingColor may be the `accent` or `ink` sentinel; this
 * resolves it to the actual hex so every consumer (StyleScope vars, DOCX
 * export, tests) derives the same color from the same config. ── */

export function resolveHeadingHex(config: Pick<ResumeStyleConfig, "accentColor" | "headingColor">): string {
  if (config.headingColor === HEADING_COLOR_ACCENT) return config.accentColor;
  if (config.headingColor === HEADING_COLOR_INK) return HEADING_INK_HEX;
  return config.headingColor;
}

/* ── CSS custom properties (inline on the scope root) ── */

/** Map a bulletStyle option to the actual character rendered in template bullet spans. */
export function bulletStyleToChar(bulletStyle: BulletStyle): string {
  switch (bulletStyle) {
    case "bullet": return "\u2022";  // •
    case "circle": return "\u25CB";  // ○
    case "dash":   return "\u2013";  // –
    case "square": return "\u25AA";  // ▪
    default:        return "\u2022";  // •
  }
}

export function buildStyleVars(config: ResumeStyleConfig): Record<string, string> {
  const font = FONT_OPTIONS.find((f) => f.id === config.fontFamily);
  return {
    "--rs-font": font ? font.stack : fontFamilies.sans,
    "--rs-font-scale": String(config.fontScale),
    "--rs-line-height": String(config.lineHeight),
    "--rs-accent": config.accentColor,
    "--rs-heading": resolveHeadingHex(config),
    "--rs-body": config.bodyColor,
    "--rs-heading-transform": config.headingStyle === "uppercase" ? "uppercase" : config.headingStyle === "title-case" ? "capitalize" : "none",
    "--rs-heading-spacing": config.headingStyle === "uppercase" ? "0.08em" : "normal",
    "--rs-heading-weight": config.headingWeight === "semibold" ? "600" : "700",
    "--rs-bullet": config.bulletStyle === "bullet" ? "disc" : config.bulletStyle === "circle" ? "circle" : config.bulletStyle === "dash" ? "-" : "square",
    "--rs-bullet-size": config.bulletSize === "small" ? "0.72em" : "1em",
    "--rs-section-spacing": `${config.sectionSpacing}px`,
    "--rs-entry-spacing": `${config.entrySpacing}px`,
    "--rs-page-margin": `${config.pageMargin}px`,
    "--rs-section-title-transform": config.sectionTitleStyle === "uppercase" ? "uppercase" : config.sectionTitleStyle === "bold" ? "none" : "none",
    "--rs-section-title-weight": config.sectionTitleStyle === "bold" ? "800" : "",
    "--rs-section-title-border": config.sectionTitleStyle === "minimal" ? "none" : config.dividerStyle === "none" ? "none" : config.dividerStyle === "dots" ? "1px dotted var(--rs-accent)" : config.dividerStyle === "gradient" ? "2px solid var(--rs-accent)" : "",
    "--rs-skill-gap": config.skillPresentation === "tags" ? "6px" : config.skillPresentation === "pills" ? "6px" : "0 16px",
    "--rs-skill-display": config.skillPresentation === "inline" ? "inline" : config.skillPresentation === "list" ? "block" : "inline-flex",
  };
}

/* ── Stylesheet rules. Only SUPPORTED options that DIVERGE from the platform
 *    default emit a rule — an untouched config produces zero overrides, so
 *    every template renders exactly as designed. `!important` is required to
 *    beat the templates' inline styles, and the scope attribute keeps the
 *    overrides contained to the sheet. ── */

export function buildStyleRules(config: ResumeStyleConfig, supported: Set<StyleOptionKey>): string {
  const rules: string[] = [];

  if (supported.has("fontFamily") && config.fontFamily !== DEFAULT_STYLE_CONFIG.fontFamily) {
    rules.push(`[data-rs-scope], [data-rs-scope] * { font-family: var(--rs-font) !important; }`);
  }
  if (supported.has("fontScale") && config.fontScale !== DEFAULT_STYLE_CONFIG.fontScale) {
    // zoom scales px- and rem-based type uniformly without touching templates.
    rules.push(`[data-rs-scope] { zoom: var(--rs-font-scale); }`);
  }
  if (supported.has("lineHeight") && config.lineHeight !== DEFAULT_STYLE_CONFIG.lineHeight) {
    rules.push(`[data-rs-scope] * { line-height: var(--rs-line-height) !important; }`);
  }
  if (supported.has("bodyColor") && config.bodyColor !== DEFAULT_STYLE_CONFIG.bodyColor) {
    // Body text inherits the sheet's base color; explicit inline colors
    // (headings, accents) keep their own, so this is a safe body-only shift.
    rules.push(`[data-rs-scope] { color: var(--rs-body) !important; }`);
  }
  if (supported.has("headingColor") && config.headingColor !== DEFAULT_STYLE_CONFIG.headingColor) {
    rules.push(`[data-rs-scope] h1, [data-rs-scope] h2, [data-rs-scope] h3, [data-rs-scope] h4 { color: var(--rs-heading) !important; }`);
  }
  if (supported.has("accentColor") && config.accentColor !== DEFAULT_STYLE_CONFIG.accentColor) {
    rules.push(`[data-rs-scope] a { color: var(--rs-accent) !important; }`);
    rules.push(`[data-rs-scope] li::marker { color: var(--rs-accent) !important; }`);
  }
  if (supported.has("headingStyle") && config.headingStyle !== DEFAULT_STYLE_CONFIG.headingStyle) {
    rules.push(`[data-rs-scope] h1, [data-rs-scope] h2, [data-rs-scope] h3, [data-rs-scope] h4 { text-transform: var(--rs-heading-transform) !important; letter-spacing: var(--rs-heading-spacing) !important; }`);
  }
  if (supported.has("headingWeight") && config.headingWeight !== DEFAULT_STYLE_CONFIG.headingWeight) {
    rules.push(`[data-rs-scope] h1, [data-rs-scope] h2, [data-rs-scope] h3, [data-rs-scope] h4 { font-weight: var(--rs-heading-weight) !important; }`);
  }
  if (supported.has("bulletStyle") && config.bulletStyle !== DEFAULT_STYLE_CONFIG.bulletStyle) {
    rules.push(`[data-rs-scope] ul { list-style-type: var(--rs-bullet) !important; }`);
  }
  if (supported.has("bulletSize") && config.bulletSize !== DEFAULT_STYLE_CONFIG.bulletSize) {
    // Marker-only sizing — content text is never resized.
    rules.push(`[data-rs-scope] li::marker { font-size: var(--rs-bullet-size) !important; }`);
  }
  if (supported.has("sectionSpacing") && config.sectionSpacing !== DEFAULT_STYLE_CONFIG.sectionSpacing) {
    rules.push(`[data-rs-scope] section { margin-bottom: var(--rs-section-spacing) !important; }`);
  }
  if (supported.has("entrySpacing") && config.entrySpacing !== DEFAULT_STYLE_CONFIG.entrySpacing) {
    rules.push(`[data-rs-scope] article + article { margin-top: var(--rs-entry-spacing) !important; }`);
  }
  if (supported.has("pageMargin") && config.pageMargin !== DEFAULT_STYLE_CONFIG.pageMargin) {
    rules.push(`[data-rs-scope] > * { padding: var(--rs-page-margin) !important; }`);
  }

  // Section title overrides — target h2 elements used as section titles
  if (supported.has("sectionTitleStyle") && config.sectionTitleStyle !== DEFAULT_STYLE_CONFIG.sectionTitleStyle) {
    if (config.sectionTitleStyle === "uppercase") {
      rules.push(`[data-rs-scope] h2 { text-transform: uppercase !important; letter-spacing: 0.1em !important; }`);
    } else if (config.sectionTitleStyle === "bold") {
      rules.push(`[data-rs-scope] h2 { font-weight: 800 !important; }`);
    } else if (config.sectionTitleStyle === "minimal") {
      rules.push(`[data-rs-scope] h2 { border-bottom: none !important; padding-bottom: 0 !important; font-weight: 600 !important; font-size: 10px !important; color: var(--rs-heading) !important; }`);
    }
  }

  // Divider overrides — affect section border-bottom styles
  if (supported.has("dividerStyle") && config.dividerStyle !== DEFAULT_STYLE_CONFIG.dividerStyle) {
    if (config.dividerStyle === "none") {
      rules.push(`[data-rs-scope] h2 { border-bottom: none !important; padding-bottom: 0 !important; }`);
    } else if (config.dividerStyle === "dots") {
      rules.push(`[data-rs-scope] h2 { border-bottom: 1px dotted var(--rs-accent) !important; }`);
    } else if (config.dividerStyle === "gradient") {
      rules.push(`[data-rs-scope] h2 { border-bottom: 2px solid var(--rs-accent) !important; border-image: linear-gradient(to right, var(--rs-accent), transparent) 1 !important; }`);
    }
  }

  // Skill presentation — affect skill container layout
  if (supported.has("skillPresentation") && config.skillPresentation !== DEFAULT_STYLE_CONFIG.skillPresentation) {
    if (config.skillPresentation === "pills") {
      rules.push(`[data-rs-scope] [data-rs-skills] > span, [data-rs-scope] [data-rs-skills] > div { display: inline-flex !important; padding: 2px 10px !important; border-radius: 9999px !important; background: rgba(0,0,0,0.04) !important; font-size: inherit !important; }`);
    } else if (config.skillPresentation === "tags") {
      rules.push(`[data-rs-scope] [data-rs-skills] > span, [data-rs-scope] [data-rs-skills] > div { display: inline-flex !important; padding: 2px 8px !important; border-radius: 4px !important; background: rgba(0,0,0,0.04) !important; border: 1px solid rgba(0,0,0,0.08) !important; font-size: inherit !important; }`);
    } else if (config.skillPresentation === "list") {
      rules.push(`[data-rs-scope] [data-rs-skills] { display: block !important; } [data-rs-scope] [data-rs-skills] > span, [data-rs-scope] [data-rs-skills] > div { display: block !important; padding: 1px 0 !important; }`);
    }
  }

  return rules.join("\n");
}
