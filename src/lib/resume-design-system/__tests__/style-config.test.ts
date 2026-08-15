"use strict";

import { describe, it, expect } from "vitest";
import {
  DEFAULT_STYLE_CONFIG,
  resolveStyleConfig,
  getTemplateStyleSupport,
  buildStyleVars,
  buildStyleRules,
  spacingTier,
  SECTION_SPACING_TIERS,
  ENTRY_SPACING_TIERS,
  PAGE_MARGIN_TIERS,
  ATS_SAFE,
} from "../style-config";

const ALL_KEYS = Object.keys(DEFAULT_STYLE_CONFIG) as (keyof typeof DEFAULT_STYLE_CONFIG)[];

describe("resolveStyleConfig", () => {
  it("returns the platform defaults for an empty config", () => {
    expect(resolveStyleConfig()).toEqual(DEFAULT_STYLE_CONFIG);
  });

  it("merges a partial config over the defaults", () => {
    const c = resolveStyleConfig({ fontFamily: "playfair", lineHeight: 1.8 });
    expect(c.fontFamily).toBe("playfair");
    expect(c.lineHeight).toBe(1.8);
    expect(c.fontScale).toBe(1);
    expect(c.accentColor).toBe(DEFAULT_STYLE_CONFIG.accentColor);
  });

  it("clamps out-of-range numeric values to ATS-safe bounds", () => {
    const c = resolveStyleConfig({ fontScale: 3, lineHeight: 0.5, sectionSpacing: 100, entrySpacing: -5, pageMargin: 2 });
    expect(c.fontScale).toBe(1.1);
    expect(c.lineHeight).toBe(1.4);
    expect(c.sectionSpacing).toBe(32);
    expect(c.entrySpacing).toBe(8);
    expect(c.pageMargin).toBe(24);
  });

  it("rejects unknown fonts and invalid colors, falling back to defaults", () => {
    const c = resolveStyleConfig({ fontFamily: "comic-sans", accentColor: "red", headingColor: "not-a-color" });
    expect(c.fontFamily).toBe(DEFAULT_STYLE_CONFIG.fontFamily);
    expect(c.accentColor).toBe(DEFAULT_STYLE_CONFIG.accentColor);
    expect(c.headingColor).toBe(DEFAULT_STYLE_CONFIG.headingColor);
  });

  it("accepts the 'accent' and 'ink' heading-color sentinels", () => {
    expect(resolveStyleConfig({ headingColor: "accent" }).headingColor).toBe("accent");
    expect(resolveStyleConfig({ headingColor: "ink" }).headingColor).toBe("ink");
    expect(resolveStyleConfig({ headingColor: "#0f172a" }).headingColor).toBe("#0f172a");
    expect(resolveStyleConfig({ headingColor: "purple" }).headingColor).toBe(DEFAULT_STYLE_CONFIG.headingColor);
  });

  it("rejects invalid enumerated styles", () => {
    const c = resolveStyleConfig({ headingStyle: "shouty" as never, bulletStyle: "star" as never, density: "huge" as never });
    expect(c.headingStyle).toBe(DEFAULT_STYLE_CONFIG.headingStyle);
    expect(c.bulletStyle).toBe(DEFAULT_STYLE_CONFIG.bulletStyle);
    expect(c.density).toBe(DEFAULT_STYLE_CONFIG.density);
  });

  it("accepts valid heading weights and bullet sizes, rejects invalid ones", () => {
    expect(resolveStyleConfig({ headingWeight: "semibold" }).headingWeight).toBe("semibold");
    expect(resolveStyleConfig({ headingWeight: "bold" }).headingWeight).toBe("bold");
    expect(resolveStyleConfig({ headingWeight: "auto" }).headingWeight).toBe("auto");
    expect(resolveStyleConfig({ headingWeight: "black" as never }).headingWeight).toBe(DEFAULT_STYLE_CONFIG.headingWeight);

    expect(resolveStyleConfig({ bulletSize: "small" }).bulletSize).toBe("small");
    expect(resolveStyleConfig({ bulletSize: "normal" }).bulletSize).toBe("normal");
    expect(resolveStyleConfig({ bulletSize: "auto" }).bulletSize).toBe("auto");
    expect(resolveStyleConfig({ bulletSize: "huge" as never }).bulletSize).toBe(DEFAULT_STYLE_CONFIG.bulletSize);
  });
});

describe("getTemplateStyleSupport", () => {
  it("supports every option on a standard-layout template", () => {
    const s = getTemplateStyleSupport("modern-clean");
    for (const k of ALL_KEYS) {
      expect(s.has(k), `expected ${k} to be supported`).toBe(true);
    }
  });

  it("hides pageMargin on multi-column / sidebar / banner layouts", () => {
    expect(getTemplateStyleSupport("sidebar-elegance").has("pageMargin")).toBe(false);
    expect(getTemplateStyleSupport("banner-bold").has("pageMargin")).toBe(false);
    expect(getTemplateStyleSupport("executive").has("pageMargin")).toBe(false);
  });

  it("hides color options on dark themes but keeps typography", () => {
    const s = getTemplateStyleSupport("dark-elegance");
    expect(s.has("accentColor")).toBe(false);
    expect(s.has("headingColor")).toBe(false);
    expect(s.has("bodyColor")).toBe(false);
    expect(s.has("fontScale")).toBe(true);
    expect(s.has("lineHeight")).toBe(true);
  });

  it("keeps tech-mono's identity: no font, color, or case swapping", () => {
    const s = getTemplateStyleSupport("tech-mono");
    expect(s.has("fontFamily")).toBe(false);
    expect(s.has("headingStyle")).toBe(false);
    expect(s.has("accentColor")).toBe(false);
    expect(s.has("headingColor")).toBe(false);
    expect(s.has("bodyColor")).toBe(false);
    expect(s.has("lineHeight")).toBe(true);
  });
});

describe("buildStyleRules", () => {
  it("emits no rules for the default config — templates render natively", () => {
    expect(buildStyleRules(DEFAULT_STYLE_CONFIG, getTemplateStyleSupport("modern-clean"))).toBe("");
  });

  it("emits a font-family rule only when the font diverges from default", () => {
    const rules = buildStyleRules({ ...DEFAULT_STYLE_CONFIG, fontFamily: "playfair" }, getTemplateStyleSupport("modern-clean"));
    expect(rules).toContain("font-family: var(--rs-font) !important");
  });

  it("emits zoom, spacing, and margin rules on divergence", () => {
    const rules = buildStyleRules(
      { ...DEFAULT_STYLE_CONFIG, fontScale: 1.1, sectionSpacing: 32, entrySpacing: 8, pageMargin: 48 },
      getTemplateStyleSupport("modern-clean"),
    );
    expect(rules).toContain("zoom: var(--rs-font-scale)");
    expect(rules).toContain("margin-bottom: var(--rs-section-spacing)");
    expect(rules).toContain("margin-top: var(--rs-entry-spacing)");
    expect(rules).toContain("padding: var(--rs-page-margin)");
  });

  it("never emits rules for unsupported options", () => {
    const rules = buildStyleRules(
      { ...DEFAULT_STYLE_CONFIG, pageMargin: 48, accentColor: "#dc2626" },
      getTemplateStyleSupport("sidebar-elegance"),
    );
    expect(rules).not.toContain("--rs-page-margin");
    expect(rules).toContain("--rs-accent");

    const mono = buildStyleRules({ ...DEFAULT_STYLE_CONFIG, fontFamily: "playfair" }, getTemplateStyleSupport("tech-mono"));
    expect(mono).not.toContain("font-family");
  });

  it("resolves 'accent' heading color to the accent color variable", () => {
    const vars = buildStyleVars(resolveStyleConfig({ headingColor: "accent", accentColor: "#059669" }));
    expect(vars["--rs-heading"]).toBe("#059669");
    expect(vars["--rs-accent"]).toBe("#059669");
  });

  it("resolves the default 'ink' heading color to ink hex with no rule", () => {
    const vars = buildStyleVars(resolveStyleConfig());
    expect(vars["--rs-heading"]).toBe("#0f172a");
    const rules = buildStyleRules(resolveStyleConfig(), getTemplateStyleSupport("modern-clean"));
    expect(rules).not.toContain("--rs-heading");
  });

  it("emits a heading rule for an explicit 'Dark/ink' choice even though it equals the ink hex", () => {
    // The user's explicit choice must always override a template's native
    // heading color (e.g. corporate-blue's blue section titles).
    const rules = buildStyleRules({ ...DEFAULT_STYLE_CONFIG, headingColor: "#0f172a" }, getTemplateStyleSupport("corporate-blue"));
    expect(rules).toContain("color: var(--rs-heading) !important");
  });

  it("maps heading weights and bullet sizes to CSS values", () => {
    const vars = buildStyleVars(resolveStyleConfig({ headingWeight: "semibold", bulletSize: "small" }));
    expect(vars["--rs-heading-weight"]).toBe("600");
    expect(vars["--rs-bullet-size"]).toBe("0.72em");
    const varsBold = buildStyleVars(resolveStyleConfig({ headingWeight: "bold", bulletSize: "normal" }));
    expect(varsBold["--rs-heading-weight"]).toBe("700");
    expect(varsBold["--rs-bullet-size"]).toBe("1em");
  });

  it("emits heading-weight and bullet-size rules only when diverged from native (auto)", () => {
    const defaults = buildStyleRules(resolveStyleConfig(), getTemplateStyleSupport("modern-clean"));
    expect(defaults).not.toContain("--rs-heading-weight");
    expect(defaults).not.toContain("--rs-bullet-size");

    const rules = buildStyleRules(
      resolveStyleConfig({ headingWeight: "semibold", bulletSize: "small" }),
      getTemplateStyleSupport("modern-clean"),
    );
    expect(rules).toContain("font-weight: var(--rs-heading-weight) !important");
    expect(rules).toContain("font-size: var(--rs-bullet-size) !important");
  });

  it("explicit Bold/Normal choices always emit even though they map to common native values", () => {
    const rules = buildStyleRules(resolveStyleConfig({ headingWeight: "bold", bulletSize: "normal" }), getTemplateStyleSupport("modern-clean"));
    expect(rules).toContain("font-weight: var(--rs-heading-weight) !important");
    expect(rules).toContain("font-size: var(--rs-bullet-size) !important");
  });

  it("keeps every spacing tier inside the ATS-safe bounds", () => {
    for (const t of SECTION_SPACING_TIERS) {
      expect(t.px).toBeGreaterThanOrEqual(ATS_SAFE.minSectionSpacing);
      expect(t.px).toBeLessThanOrEqual(ATS_SAFE.maxSectionSpacing);
    }
    for (const t of ENTRY_SPACING_TIERS) {
      expect(t.px).toBeGreaterThanOrEqual(ATS_SAFE.minEntrySpacing);
      expect(t.px).toBeLessThanOrEqual(ATS_SAFE.maxEntrySpacing);
    }
    for (const t of PAGE_MARGIN_TIERS) {
      expect(t.px).toBeGreaterThanOrEqual(ATS_SAFE.minPageMargin);
      expect(t.px).toBeLessThanOrEqual(ATS_SAFE.maxPageMargin);
    }
  });

  it("spacingTier resolves px values to curated tiers with a Normal fallback", () => {
    expect(spacingTier(SECTION_SPACING_TIERS, 16).name).toBe("Tight");
    expect(spacingTier(SECTION_SPACING_TIERS, 24).name).toBe("Normal");
    expect(spacingTier(SECTION_SPACING_TIERS, 32).name).toBe("Spacious");
    expect(spacingTier(ENTRY_SPACING_TIERS, 12).name).toBe("Normal"); // off-tier value falls back
    expect(spacingTier(PAGE_MARGIN_TIERS, 48).name).toBe("Wide");
  });

  it("keeps heading/body color and bullet rules scoped to the sheet", () => {
    const rules = buildStyleRules(
      { ...DEFAULT_STYLE_CONFIG, bodyColor: "#4b5563", headingColor: "#111827", bulletStyle: "square" },
      getTemplateStyleSupport("modern-clean"),
    );
    expect(rules).toContain("[data-rs-scope] { color: var(--rs-body) !important; }");
    expect(rules).toContain("[data-rs-scope] h1, [data-rs-scope] h2, [data-rs-scope] h3, [data-rs-scope] h4 { color: var(--rs-heading) !important; }");
    expect(rules).toContain("list-style-type: var(--rs-bullet) !important");
  });
});

describe("buildStyleVars", () => {
  it("maps curated font ids to the loaded next/font stacks", () => {
    expect(buildStyleVars(resolveStyleConfig({ fontFamily: "garamond" }))["--rs-font"]).toContain("var(--font-garamond)");
    expect(buildStyleVars(resolveStyleConfig({ fontFamily: "mono" }))["--rs-font"]).toContain("var(--font-jetbrains)");
    expect(buildStyleVars(resolveStyleConfig({ fontFamily: "inter" }))["--rs-font"]).toContain("var(--font-sans)");
  });

  it("maps heading and bullet styles to CSS values", () => {
    const vars = buildStyleVars(resolveStyleConfig({ headingStyle: "uppercase", bulletStyle: "dash" }));
    expect(vars["--rs-heading-transform"]).toBe("uppercase");
    expect(vars["--rs-heading-spacing"]).toBe("0.08em");
    expect(vars["--rs-bullet"]).toBe("-");
  });
});
