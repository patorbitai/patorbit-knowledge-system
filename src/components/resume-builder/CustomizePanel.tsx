"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Palette, Heading1, List, SlidersHorizontal, RotateCcw, Check, Layout, Contact, Minus, Tag, Calendar, type LucideIcon } from "lucide-react";
import { useMemo, useEffect, useRef } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { LiveStylePreview } from "./LiveStylePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import {
  DEFAULT_STYLE_CONFIG,
  FONT_OPTIONS,
  FONT_SCALE_OPTIONS,
  LINE_HEIGHT_OPTIONS,
  ACCENT_COLOR_OPTIONS,
  HEADING_COLOR_OPTIONS,
  BODY_COLOR_OPTIONS,
  HEADING_STYLE_OPTIONS,
  HEADING_WEIGHT_OPTIONS,
  HEADING_COLOR_INK,
  HEADING_INK_HEX,
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

/** One-line descriptors shown under each font option card. */
const FONT_DESCRIPTORS: Record<string, string> = {
  jakarta: "Clean & Modern",
  inter: "Neutral & Readable",
  playfair: "Elegant Serif",
  garamond: "Classic Serif",
  mono: "Technical Mono",
};

const SELECTED_CLASS = "border-cyan-400/50 bg-cyan-500/[0.08]";
const NEUTRAL_CLASS = "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14]";
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

  const patch = (partial: Partial<ResumeStyleConfig>) => setStyleConfig(resumeId, partial);

  const density = DENSITY_OPTIONS.find((d) => d.value === config.density);
  const applyDensity = (value: (typeof DENSITY_OPTIONS)[number]["value"]) => {
    const option = DENSITY_OPTIONS.find((d) => d.value === value);
    if (!option) return;
    patch({ density: option.value, sectionSpacing: option.section, entrySpacing: option.entry });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customize-panel-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] h-[100dvh] w-full overflow-hidden bg-white dark:bg-[#0A0E1B] text-gray-900 dark:text-white flex flex-col"
        >
          {/* Header — fixed */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20">
                <SlidersHorizontal className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="customize-panel-title" className="text-sm font-semibold text-white tracking-tight">Customize</h2>
                  <span className="text-[10px] font-medium text-cyan-300/90 px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                    {templateName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Make your resume feel like you.</p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close customize panel"
              className={`p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all ${FOCUS_CLASS}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content — independent scroll regions */}
          <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-x-hidden">
            {/* Left: customization controls — own scrollbar */}
            <aside
              aria-label="Customization controls"
              className="flex flex-col min-h-0 max-h-[45vh] md:max-h-none md:w-[400px] lg:w-[420px] shrink-0 border-b md:border-b-0 md:border-r border-white/[0.06] overscroll-contain"
            >
              <div data-testid="customize-controls-scroll" className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-4 space-y-3">
                <Section icon={Type} title="Typography" description="Fonts and reading rhythm">
                  <OptionRow label="Font family" option="fontFamily" supported={supported}>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_OPTIONS.map((f) => {
                        const selected = config.fontFamily === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => patch({ fontFamily: f.id })}
                            aria-label={f.name}
                            aria-pressed={selected}
                            className={`relative text-left rounded-lg border px-3 py-2 transition-all ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            {selected && (
                              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[#062b3a]">
                                <Check className="w-2.5 h-2.5" strokeWidth={3} />
                              </span>
                            )}
                            <span className="block text-lg leading-none mb-1" style={{ fontFamily: f.stack }}>Aa</span>
                            <span className="block text-[11px] font-medium text-slate-200 leading-tight pr-4">{f.name}</span>
                            <span className="block text-[9px] text-slate-500 mt-0.5">{FONT_DESCRIPTORS[f.id] ?? f.category}</span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                  <OptionRow label="Font size" option="fontScale" supported={supported}>
                    <Segmented
                      options={FONT_SCALE_OPTIONS.map((v) => ({ value: v, label: `${Math.round(v * 100)}%` }))}
                      value={config.fontScale}
                      onSelect={(v) => patch({ fontScale: v as number })}
                    />
                  </OptionRow>
                  <OptionRow label="Line height" option="lineHeight" supported={supported}>
                    <Segmented
                      options={LINE_HEIGHT_OPTIONS.map((v) => ({ value: v, label: String(v) }))}
                      value={config.lineHeight}
                      onSelect={(v) => patch({ lineHeight: v as number })}
                    />
                  </OptionRow>
                </Section>

                <Section icon={Palette} title="Colors" description="A curated professional palette">
                  <SwatchRow label="Accent color" option="accentColor" options={ACCENT_COLOR_OPTIONS} value={config.accentColor} supported={supported} onSelect={(v) => patch({ accentColor: v })} />
                  <OptionRow label="Heading color" option="headingColor" supported={supported}>
                    <Segmented
                      options={HEADING_COLOR_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                      value={config.headingColor === HEADING_COLOR_INK ? HEADING_INK_HEX : config.headingColor}
                      onSelect={(v) => patch({ headingColor: v as string })}
                    />
                  </OptionRow>
                  <SwatchRow label="Body text color" option="bodyColor" options={BODY_COLOR_OPTIONS} value={config.bodyColor} supported={supported} onSelect={(v) => patch({ bodyColor: v })} />
                </Section>

                <Section icon={Heading1} title="Headings" description="Structure and emphasis">
                  <OptionRow label="Heading style" option="headingStyle" supported={supported}>
                    <div className="grid grid-cols-3 gap-2">
                      {HEADING_STYLE_OPTIONS.map((o) => {
                        const selected = config.headingStyle === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ headingStyle: o.value })}
                            aria-label={o.name}
                            aria-pressed={selected}
                            className={`rounded-lg border px-2 py-2 text-center transition-all ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span
                              className="block text-sm font-bold leading-none mb-1"
                              style={{
                                textTransform: o.value === "uppercase" ? "uppercase" : o.value === "title-case" ? "capitalize" : "none",
                                letterSpacing: o.value === "uppercase" ? "0.12em" : "normal",
                              }}
                            >
                              Aa
                            </span>
                            <span className="block text-[9px] font-medium text-slate-400">{o.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                  <OptionRow label="Heading weight" option="headingWeight" supported={supported}>
                    <div className="grid grid-cols-2 gap-2">
                      {HEADING_WEIGHT_OPTIONS.map((o) => {
                        const selected = (config.headingWeight === "auto" ? "bold" : config.headingWeight) === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ headingWeight: o.value })}
                            aria-label={o.name}
                            aria-pressed={selected}
                            className={`rounded-lg border px-3 py-2 transition-all ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span className="block text-base leading-none" style={{ fontWeight: o.css }}>Aa</span>
                            <span className="block text-[10px] font-medium text-slate-400 mt-1">{o.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                </Section>

                <Section icon={List} title="Bullets" description="List markers">
                  <OptionRow label="Bullet style" option="bulletStyle" supported={supported}>
                    <div className="grid grid-cols-2 gap-2">
                      {BULLET_STYLE_OPTIONS.map((o) => {
                        const selected = config.bulletStyle === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ bulletStyle: o.value })}
                            aria-label={o.name}
                            aria-pressed={selected}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span className="text-sm text-slate-300">{o.glyph}</span>
                            <span className="text-[11px] text-slate-300">Item</span>
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

                <Section icon={SlidersHorizontal} title="Spacing & Layout" description="White space and page fit">
                  <OptionRow label="Density" option="density" supported={supported}>
                    <Segmented
                      options={DENSITY_OPTIONS.map((d) => ({ value: d.value, label: d.name }))}
                      value={config.density}
                      onSelect={(v) => applyDensity(v as (typeof DENSITY_OPTIONS)[number]["value"])}
                    />
                  </OptionRow>
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
                  <OptionRow label="Page margins" option="pageMargin" supported={supported}>
                    <Segmented
                      options={PAGE_MARGIN_TIERS.map((t) => ({ value: t.px, label: t.name }))}
                      value={spacingTier(PAGE_MARGIN_TIERS, config.pageMargin).px}
                      onSelect={(v) => patch({ pageMargin: v as number })}
                    />
                  </OptionRow>
                  {density && (
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {density.name} density · {density.section}px between sections, {density.entry}px between entries.
                    </p>
                  )}
                </Section>

                <Section icon={Heading1} title="Section Titles" description="How section headers look">
                  <OptionRow label="Title style" option="sectionTitleStyle" supported={supported}>
                    <div className="grid grid-cols-2 gap-2">
                      {SECTION_TITLE_STYLE_OPTIONS.map((o) => {
                        const selected = config.sectionTitleStyle === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ sectionTitleStyle: o.value })}
                            aria-label={o.name}
                            aria-pressed={selected}
                            className={`rounded-lg border px-3 py-2 text-center transition-all ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span className="block text-sm font-semibold text-slate-200">{o.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                  <OptionRow label="Divider" option="dividerStyle" supported={supported}>
                    <div className="grid grid-cols-2 gap-2">
                      {DIVIDER_STYLE_OPTIONS.map((o) => {
                        const selected = config.dividerStyle === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ dividerStyle: o.value })}
                            aria-label={o.name}
                            aria-pressed={selected}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span className="text-sm text-slate-300">{o.glyph}</span>
                            <span className="text-[11px] text-slate-300">{o.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                </Section>

                <Section icon={Layout} title="Layout" description="Contact and content arrangement">
                  <OptionRow label="Contact layout" option="contactLayout" supported={supported}>
                    <Segmented
                      options={CONTACT_LAYOUT_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                      value={config.contactLayout}
                      onSelect={(v) => patch({ contactLayout: v as ResumeStyleConfig["contactLayout"] })}
                    />
                  </OptionRow>
                  <OptionRow label="Date format" option="dateFormat" supported={supported}>
                    <Segmented
                      options={DATE_FORMAT_OPTIONS.map((o) => ({ value: o.value, label: o.name }))}
                      value={config.dateFormat}
                      onSelect={(v) => patch({ dateFormat: v as ResumeStyleConfig["dateFormat"] })}
                    />
                  </OptionRow>
                </Section>

                <Section icon={Tag} title="Skills" description="How skills are presented">
                  <OptionRow label="Presentation" option="skillPresentation" supported={supported}>
                    <div className="grid grid-cols-2 gap-2">
                      {SKILL_PRESENTATION_OPTIONS.map((o) => {
                        const selected = config.skillPresentation === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => patch({ skillPresentation: o.value })}
                            aria-label={o.name}
                            aria-pressed={selected}
                            className={`rounded-lg border px-3 py-2 text-center transition-all ${FOCUS_CLASS} ${selected ? SELECTED_CLASS : NEUTRAL_CLASS}`}
                          >
                            <span className="block text-sm font-medium text-slate-200">{o.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </OptionRow>
                </Section>
              </div>

              {/* Footer — pinned, always visible */}
              <div data-testid="customize-controls-footer" className="shrink-0 px-4 py-3 bg-white dark:bg-[#0A0E1B] border-t border-gray-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
                <button
                  onClick={() => resetStyleConfig(resumeId)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] transition-all ${FOCUS_CLASS}`}
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to Template Defaults
                </button>
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#9333ea] text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.99] transition-all ${FOCUS_CLASS}`}
                >
                  Done
                </button>
              </div>
            </aside>

            {/* Right: live resume preview (user's resume + active template + style config) */}
            <div className="flex-1 min-w-0 min-h-0 overflow-hidden" data-testid="customize-live-column">
              <LiveStylePreview />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Premium building blocks ── */

function Section({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5 border-b border-white/[0.05]">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/15 shrink-0">
          <Icon className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-slate-200 leading-tight">{title}</h3>
          {description && <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

function OptionRow({ label, option, supported, children }: { label: string; option: StyleOptionKey; supported: Set<StyleOptionKey>; children: React.ReactNode }) {
  if (!supported.has(option)) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-300 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

/** Compact segmented control — the standard control for small option sets. */
function Segmented<T extends string | number>({ options, value, onSelect }: { options: { value: T; label: string }[]; value: T; onSelect: (v: T) => void }) {
  return (
    <div role="group" className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onSelect(o.value)}
          aria-pressed={value === o.value}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${FOCUS_CLASS} ${
            value === o.value
              ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-300"
              : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.14]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Premium color swatch — ring + check on the selected color, name via label/tooltip. */
function SwatchRow({ label, option, options, value, supported, onSelect }: { label: string; option: StyleOptionKey; options: { value: string; name: string }[]; value: string; supported: Set<StyleOptionKey>; onSelect: (v: string) => void }) {
  if (!supported.has(option)) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-300 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onSelect(o.value)}
              aria-label={o.name}
              aria-pressed={selected}
              title={o.name}
              className={`relative h-8 w-8 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                selected ? "border-cyan-400 ring-2 ring-cyan-400/25 scale-105" : "border-white/15 hover:scale-105 hover:border-white/30"
              }`}
              style={{ backgroundColor: o.value }}
            >
              {selected && (
                <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
