"use client";

/**
 * Resume Customize — a design studio, not a settings dashboard.
 *
 * IA (redesign brief §1):
 *   DESIGN    — Typography · Colors · Layout        (the three visual decisions)
 *   ADVANCED  — Spacing & Layout · Headings · Bullets · Details
 *               (progressively disclosed, mounted while closed so capability
 *                is never removed — only deferred)
 *
 * Raw implementation values are never the primary interface: font size shows
 * Compact/Balanced/Large, line height Compact/Comfortable/Airy (the existing
 * 0.9/1/1.1 and 1.4/1.6/1.8 scale values are preserved underneath), colors
 * show named swatches with live specimens, headings/bullets show what the
 * choice looks like.
 *
 * Every control still patches the per-resume style config exactly as before,
 * the live preview updates immediately (store → StyleScope), and the test
 * contract (labels, aria names, data-testids, mount-while-closed) holds.
 */
import { ArrowLeft, Check, ChevronDown, RotateCcw } from "lucide-react";
import { useMemo, useEffect, useRef, useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { LiveStylePreview } from "./LiveStylePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import {
  DEFAULT_STYLE_CONFIG,
  FONT_OPTIONS,
  ACCENT_COLOR_OPTIONS,
  HEADING_COLOR_OPTIONS,
  BODY_COLOR_OPTIONS,
  HEADING_STYLE_OPTIONS,
  HEADING_WEIGHT_OPTIONS,
  HEADING_COLOR_INK,
  HEADING_INK_HEX,
  HEADING_COLOR_ACCENT,
  BULLET_STYLE_OPTIONS,
  BULLET_SIZE_OPTIONS,
  DENSITY_OPTIONS,
  SECTION_SPACING_TIERS,
  SECTION_TITLE_STYLE_OPTIONS,
  CONTACT_LAYOUT_OPTIONS,
  DIVIDER_STYLE_OPTIONS,
  SKILL_PRESENTATION_OPTIONS,
  DATE_FORMAT_OPTIONS,
  ENTRY_SPACING_TIERS,
  PAGE_MARGIN_TIERS,
  spacingTier,
  getTemplateStyleSupport,
  type ResumeStyleConfig,
  type StyleOptionKey,
} from "@/lib/resume-design-system/style-config";

/** One-line descriptors shown under each font specimen. */
const FONT_DESCRIPTORS: Record<string, string> = {
  jakarta: "Clean & modern",
  inter: "Neutral & readable",
  playfair: "Elegant serif",
  garamond: "Classic serif",
  mono: "Technical mono",
};

/** Outcome-language labels mapped onto the existing scale values (§4/§5). */
const FONT_SCALE_LABELS: Record<number, string> = { 0.9: "Compact", 1: "Balanced", 1.1: "Large" };
const LINE_HEIGHT_LABELS: Record<number, string> = { 1.4: "Compact", 1.6: "Comfortable", 1.8: "Airy" };

/** Visual captions for heading-style presets (§7) — values unchanged. */
const HEADING_STYLE_CAPTIONS: Record<string, string> = {
  uppercase: "Uppercase",
  "title-case": "Title Case",
  normal: "Minimal",
};

/** Visual captions for bullet presets (§8) — values unchanged. */
const BULLET_CAPTIONS: Record<string, string> = {
  bullet: "Classic",
  circle: "Minimal",
  dash: "Dash",
  square: "Modern",
};

const SELECTED_CLASS = "border-cyan-500/60 bg-cyan-500/[0.12] text-white";
const NEUTRAL_CLASS = "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.16]";
const FOCUS_CLASS = "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50";

export function CustomizePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resumeId = useResumeBuilder((s) => s.activeResumeId);
  const templateId = useResumeBuilder((s) => s.resume.templateId);
  const stored = useResumeBuilder((s) => s.styleConfigs[s.activeResumeId]);
  const setStyleConfig = useResumeBuilder((s) => s.setStyleConfig);
  const resetStyleConfig = useResumeBuilder((s) => s.resetStyleConfig);

  const config: ResumeStyleConfig = stored ?? DEFAULT_STYLE_CONFIG;
  const supported = useMemo(() => getTemplateStyleSupport(templateId), [templateId]);
  const templateName = TEMPLATES.find((t) => t.id === templateId)?.name ?? "Template";

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => closeButtonRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Lock the document while the modal is open so the outer page can never
  // scroll behind the workspace. Restore previous overflow values on close.
  useEffect(() => {
    if (!open) return;
    const bodyPrev = document.body.style.overflow;
    const htmlPrev = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyPrev;
      document.documentElement.style.overflow = htmlPrev;
    };
  }, [open]);

  if (!open) return null;

  const patch = (partial: Partial<ResumeStyleConfig>) => setStyleConfig(resumeId, partial);

  const applyDensity = (value: (typeof DENSITY_OPTIONS)[number]["value"]) => {
    const option = DENSITY_OPTIONS.find((d) => d.value === value);
    if (!option) return;
    patch({ density: option.value, sectionSpacing: option.section, entrySpacing: option.entry });
  };

  const normalizedHeadingColor =
    config.headingColor === HEADING_COLOR_INK ? HEADING_INK_HEX : config.headingColor;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-panel-title"
      className="fixed inset-0 z-[60] h-[100dvh] w-full overflow-hidden bg-[#070d18] text-white flex flex-col"
    >
      {/* Header — one quiet line (§10) */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close customize panel"
          className={`flex items-center gap-1.5 -ml-1 px-1.5 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 ${FOCUS_CLASS}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Customize
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h2 id="customize-panel-title" className="text-[13px] font-semibold text-white truncate">
              {templateName}
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">Make your resume feel like you.</p>
        </div>
        <button
          onClick={onClose}
          className={`hidden md:inline-flex items-center h-7 px-3.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-[11px] font-medium text-white transition-colors shrink-0 ${FOCUS_CLASS}`}
        >
          Done
        </button>
      </div>

      {/* Content — controls + live preview; preview first on mobile (§14) */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-x-hidden">
        {/* Left: customization controls — own scrollbar */}
        <aside
          aria-label="Customization controls"
          className="order-2 md:order-1 flex flex-1 md:flex-none flex-col min-h-0 md:w-[400px] lg:w-[420px] shrink-0 border-t md:border-t-0 md:border-r border-white/[0.06] overscroll-contain"
        >
          <div data-testid="customize-controls-scroll" className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
            {/* ── DESIGN ── */}
            <Group label="Design">
              <Section
                title="Typography"
                description="Fonts and reading rhythm"
                options={["fontFamily", "fontScale", "lineHeight"]}
                supported={supported}
              >
                <OptionRow label="Font family" option="fontFamily" supported={supported}>
                  <div className="space-y-1.5">
                    {FONT_OPTIONS.map((f) => {
                      const selected = config.fontFamily === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => patch({ fontFamily: f.id })}
                          aria-label={f.name}
                          aria-pressed={selected}
                          className={`flex items-center gap-3 w-full rounded-md border px-3 py-2 text-left transition-colors ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                        >
                          <span
                            className="w-9 shrink-0 text-center text-lg text-slate-200"
                            style={{ fontFamily: f.stack }}
                            aria-hidden="true"
                          >
                            Aa
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] font-medium text-slate-200 leading-tight">
                              {f.name}
                            </span>
                            <span className="block text-[10px] text-slate-500 leading-tight mt-0.5">
                              {FONT_DESCRIPTORS[f.id] ?? f.category}
                            </span>
                          </span>
                          {selected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </OptionRow>
                <OptionRow label="Font size" option="fontScale" supported={supported}>
                  <Segmented
                    srPrefix="Size"
                    options={FONT_SCALE_OPTIONS_LIST}
                    value={config.fontScale}
                    onSelect={(v) => patch({ fontScale: v as number })}
                  />
                </OptionRow>
                <OptionRow label="Line height" option="lineHeight" supported={supported}>
                  <Segmented
                    srPrefix="Line height"
                    options={LINE_HEIGHT_LIST}
                    value={config.lineHeight}
                    onSelect={(v) => patch({ lineHeight: v as number })}
                  />
                </OptionRow>
              </Section>

              <Section
                title="Colors"
                description="A curated professional palette"
                options={["accentColor", "headingColor", "bodyColor"]}
                supported={supported}
              >
                <SwatchRow
                  label="Accent color"
                  option="accentColor"
                  options={ACCENT_COLOR_OPTIONS}
                  value={config.accentColor}
                  supported={supported}
                  onSelect={(v) => patch({ accentColor: v })}
                />
                <OptionRow label="Heading color" option="headingColor" supported={supported}>
                  <div className="flex flex-wrap gap-1.5">
                    {HEADING_COLOR_OPTIONS.map((o) => {
                      const selected = normalizedHeadingColor === o.value;
                      const specimen =
                        o.value === HEADING_COLOR_ACCENT ? config.accentColor : o.value;
                      return (
                        <button
                          key={o.value}
                          onClick={() => patch({ headingColor: o.value })}
                          aria-label={o.name}
                          aria-pressed={selected}
                          className={`flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                        >
                          <span
                            className="text-sm leading-none"
                            style={{ color: specimen, fontWeight: 700 }}
                            aria-hidden="true"
                          >
                            Aa
                          </span>
                          <span className="text-[11px]">{o.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </OptionRow>
                <SwatchRow
                  label="Body text color"
                  option="bodyColor"
                  options={BODY_COLOR_OPTIONS}
                  value={config.bodyColor}
                  supported={supported}
                  onSelect={(v) => patch({ bodyColor: v })}
                />
              </Section>

              <Section
                title="Layout"
                description="Density and page fit"
                options={["density", "pageMargin", "contactLayout"]}
                supported={supported}
              >
                <OptionRow label="Density" option="density" supported={supported}>
                  <Segmented
                    options={DENSITY_OPTIONS.map((d) => ({ value: d.value, label: d.name }))}
                    value={config.density}
                    onSelect={(v) => applyDensity(v as (typeof DENSITY_OPTIONS)[number]["value"])}
                  />
                </OptionRow>
                <OptionRow label="Page margins" option="pageMargin" supported={supported}>
                  <Segmented
                    options={PAGE_MARGIN_TIERS.map((t) => ({ value: t.px, label: t.name }))}
                    value={spacingTier(PAGE_MARGIN_TIERS, config.pageMargin).px}
                    onSelect={(v) => patch({ pageMargin: v as number })}
                  />
                </OptionRow>
                <OptionRow label="Contact layout" option="contactLayout" supported={supported}>
                  <Segmented
                    options={CONTACT_LAYOUT_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                    value={config.contactLayout}
                    onSelect={(v) => patch({ contactLayout: v as ResumeStyleConfig["contactLayout"] })}
                  />
                </OptionRow>
              </Section>
            </Group>

            {/* ── ADVANCED — progressively disclosed, always mounted ── */}
            <div>
              <button
                type="button"
                data-testid="customize-advanced-toggle"
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((v) => !v)}
                className={`w-full flex items-center justify-between py-1.5 rounded-md -mx-1 px-1 transition-colors ${FOCUS_CLASS} hover:bg-white/[0.03]`}
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.08em]">
                  Advanced
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div className={advancedOpen ? "space-y-5 pt-1" : "hidden"}>
                <Section
                  title="Spacing & Layout"
                  description="Fine-tune white space"
                  options={["sectionSpacing", "entrySpacing"]}
                  supported={supported}
                >
                  <OptionRow label="Section spacing" option="sectionSpacing" supported={supported}>
                    <Segmented
                      options={SECTION_SPACING_TIERS.map((t) => ({ value: t.px, label: t.name }))}
                      value={spacingTier(SECTION_SPACING_TIERS, config.sectionSpacing).px}
                      onSelect={(v) => patch({ sectionSpacing: v as number })}
                    />
                  </OptionRow>
                  <OptionRow label="Entry spacing" option="entrySpacing" supported={supported}>
                    <Segmented
                      options={ENTRY_SPACING_TIERS.map((t) => ({ value: t.px, label: t.name }))}
                      value={spacingTier(ENTRY_SPACING_TIERS, config.entrySpacing).px}
                      onSelect={(v) => patch({ entrySpacing: v as number })}
                    />
                  </OptionRow>
                </Section>

                <Section
                  title="Headings"
                  description="Style and emphasis"
                  options={["headingStyle", "headingWeight", "sectionTitleStyle", "dividerStyle"]}
                  supported={supported}
                >
                  <OptionRow label="Heading style" option="headingStyle" supported={supported}>
                    <div className="grid grid-cols-3 gap-1.5">
                      {HEADING_STYLE_OPTIONS.map((o) => {
                        const selected = config.headingStyle === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ headingStyle: o.value })}
                            aria-label={HEADING_STYLE_CAPTIONS[o.value] ?? o.name}
                            aria-pressed={selected}
                            className={`rounded-md border px-2 py-2 text-center transition-colors ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span
                              className="block text-[11px] font-semibold leading-tight text-slate-100 truncate"
                              style={{
                                textTransform:
                                  o.value === "uppercase" ? "uppercase" : o.value === "title-case" ? "capitalize" : "none",
                                letterSpacing: o.value === "uppercase" ? "0.08em" : "normal",
                              }}
                            >
                              {o.value === "uppercase" ? "Experience" : "Experience"}
                            </span>
                            <span className="block text-[9px] text-slate-500 mt-1">
                              {HEADING_STYLE_CAPTIONS[o.value] ?? o.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                  <OptionRow label="Heading weight" option="headingWeight" supported={supported}>
                    <div className="flex flex-wrap gap-1.5">
                      {HEADING_WEIGHT_OPTIONS.map((o) => {
                        const selected = (config.headingWeight === "auto" ? "bold" : config.headingWeight) === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ headingWeight: o.value })}
                            aria-label={o.name}
                            aria-pressed={selected}
                            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span className="text-sm leading-none text-slate-100" style={{ fontWeight: o.css }} aria-hidden="true">
                              Aa
                            </span>
                            <span className="text-[11px]">{o.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                  <OptionRow label="Title style" option="sectionTitleStyle" supported={supported}>
                    <Segmented
                      options={SECTION_TITLE_STYLE_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                      value={config.sectionTitleStyle}
                      onSelect={(v) => patch({ sectionTitleStyle: v as ResumeStyleConfig["sectionTitleStyle"] })}
                    />
                  </OptionRow>
                  <OptionRow label="Divider" option="dividerStyle" supported={supported}>
                    <Segmented
                      options={DIVIDER_STYLE_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                      value={config.dividerStyle}
                      onSelect={(v) => patch({ dividerStyle: v as ResumeStyleConfig["dividerStyle"] })}
                    />
                  </OptionRow>
                </Section>

                <Section
                  title="Bullets"
                  description="List markers"
                  options={["bulletStyle", "bulletSize"]}
                  supported={supported}
                >
                  <OptionRow label="Bullet style" option="bulletStyle" supported={supported}>
                    <div className="grid grid-cols-2 gap-1.5">
                      {BULLET_STYLE_OPTIONS.map((o) => {
                        const selected = config.bulletStyle === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ bulletStyle: o.value })}
                            aria-label={BULLET_CAPTIONS[o.value] ?? o.name}
                            aria-pressed={selected}
                            className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span className="w-4 shrink-0 text-center text-sm text-slate-300" aria-hidden="true">
                              {o.glyph}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[11px] leading-tight">
                                {BULLET_CAPTIONS[o.value] ?? o.name}
                              </span>
                              <span className="block text-[9px] text-slate-500 leading-tight truncate">
                                Led a team of 10
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                  <OptionRow label="Bullet size" option="bulletSize" supported={supported}>
                    <Segmented
                      options={BULLET_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                      value={config.bulletSize === "auto" ? "normal" : config.bulletSize}
                      onSelect={(v) => patch({ bulletSize: v as ResumeStyleConfig["bulletSize"] })}
                    />
                  </OptionRow>
                </Section>

                <Section
                  title="Details"
                  description="Dates and skills"
                  options={["dateFormat", "skillPresentation"]}
                  supported={supported}
                >
                  <OptionRow label="Date format" option="dateFormat" supported={supported}>
                    <Segmented
                      options={DATE_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                      value={config.dateFormat}
                      onSelect={(v) => patch({ dateFormat: v as ResumeStyleConfig["dateFormat"] })}
                    />
                  </OptionRow>
                  <OptionRow label="Skills" option="skillPresentation" supported={supported}>
                    <Segmented
                      options={SKILL_PRESENTATION_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                      value={config.skillPresentation}
                      onSelect={(v) => patch({ skillPresentation: v as ResumeStyleConfig["skillPresentation"] })}
                    />
                  </OptionRow>
                </Section>
              </div>
            </div>
          </div>

          {/* Footer — compact, pinned; Done is the primary action (§11) */}
          <div
            data-testid="customize-controls-footer"
            className="shrink-0 px-4 py-2.5 bg-[#070d18] border-t border-white/[0.06] flex items-center justify-between gap-3"
          >
            <button
              onClick={() => resetStyleConfig(resumeId)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] transition-colors ${FOCUS_CLASS}`}
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Template Defaults
            </button>
            <button
              onClick={onClose}
              className={`h-8 px-4 rounded-md bg-cyan-600 hover:bg-cyan-700 text-[11px] font-semibold text-white transition-colors ${FOCUS_CLASS}`}
            >
              Done
            </button>
          </div>
        </aside>

        {/* Right: live resume preview — the visual hero (§2); top on mobile */}
        <div
          data-testid="customize-live-column"
          className="order-1 md:order-2 h-[42vh] shrink-0 md:h-auto md:shrink flex-1 min-w-0 min-h-0 overflow-hidden"
        >
          <LiveStylePreview />
        </div>
      </div>
    </div>
  );
}

/* ── Label maps for the segmented controls (values unchanged) ── */

const FONT_SCALE_OPTIONS_LIST = [0.9, 1, 1.1].map((v) => ({
  value: v,
  label: FONT_SCALE_LABELS[v],
}));
const LINE_HEIGHT_LIST = [1.4, 1.6, 1.8].map((v) => ({
  value: v,
  label: LINE_HEIGHT_LABELS[v],
}));

/* ── Building blocks ── */

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{label}</p>
      {children}
    </div>
  );
}

function Section({
  title,
  description,
  options,
  supported,
  children,
}: {
  title: string;
  description?: string;
  options: StyleOptionKey[];
  supported: Set<StyleOptionKey>;
  children: React.ReactNode;
}) {
  // A section with no supported options disappears entirely (e.g. Colors on
  // the monospace template) instead of rendering an empty shell.
  if (!options.some((o) => supported.has(o))) return null;
  return (
    <section className="border-t border-white/[0.05] pt-4 first:border-t-0 first:pt-0">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-slate-200 leading-tight">{title}</h3>
        {description && <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function OptionRow({
  label,
  option,
  supported,
  children,
}: {
  label: string;
  option: StyleOptionKey;
  supported: Set<StyleOptionKey>;
  children: React.ReactNode;
}) {
  if (!supported.has(option)) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-300 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

/**
 * Compact segmented control — the standard control for small option sets.
 * `srPrefix` prepends screen-reader-only context so visible outcome labels
 * ("Compact") stay unambiguous to assistive tech AND to exact-name lookups
 * when the same word labels a different control elsewhere.
 */
function Segmented<T extends string | number>({
  options,
  value,
  onSelect,
  srPrefix,
}: {
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
  srPrefix?: string;
}) {
  return (
    <div role="group" className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onSelect(o.value)}
          aria-pressed={value === o.value}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${FOCUS_CLASS} ${
            value === o.value
              ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-200"
              : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.16]"
          }`}
        >
          {srPrefix && <span className="sr-only">{srPrefix} </span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Named color swatch — visual sample + name, ring + check when selected. */
function SwatchRow({
  label,
  option,
  options,
  value,
  supported,
  onSelect,
}: {
  label: string;
  option: StyleOptionKey;
  options: { value: string; name: string }[];
  value: string;
  supported: Set<StyleOptionKey>;
  onSelect: (v: string) => void;
}) {
  if (!supported.has(option)) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-300 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onSelect(o.value)}
              aria-label={o.name}
              aria-pressed={selected}
              title={o.name}
              className={`flex flex-col items-center gap-1 rounded-md px-1.5 py-1 w-[54px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 ${
                selected ? "bg-cyan-500/[0.12]" : "hover:bg-white/[0.04]"
              }`}
            >
              <span
                className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected ? "border-cyan-500" : "border-white/15"
                }`}
                style={{ backgroundColor: o.value }}
              >
                {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              <span className="text-[9px] text-slate-400 leading-tight text-center w-full truncate">{o.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
