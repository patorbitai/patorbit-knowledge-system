"use client";

/**
 * M4 Phases 2/3/8 — the structured editor that opens when the user clicks
 * resume content in the live preview.
 *
 * Rules of the house:
 *  - STRUCTURED FIELDS ONLY — no rich-text/HTML content model anywhere.
 *  - Every keystroke goes through the existing store mutators, so autosave,
 *    version capture and server write-back behave exactly as they do in the
 *    center editor (Phase 9: reuse, don't rebuild).
 *  - Escape CANCELS the active edit (restores the snapshot taken on open);
 *    Done keeps it. Enter on a bullet creates the next bullet; Backspace on
 *    an empty bullet removes it.
 *  - AI only SUGGESTS: Accept / Edit / Reject. Nothing is ever applied
 *    silently, and the suggestion is generated from the user's own text.
 *  - This edits the ACTIVE resume version only — the Master Profile is a
 *    different document and is never written here.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ai } from "@/lib/ai/client";
import { retryFailedSave } from "@/lib/resume-write-back";
import { safeHref, validateWebUrl } from "@/lib/resume-links";
import { useResumePlan } from "@/lib/resume-planner/react";
import type { ResumeSectionKey, SectionPrefs } from "@/types/resume";
import type { SectionId } from "@/types/resume";
import type { InlineTarget } from "./resolveInlineTarget";
import {
  SECTION_META,
  computeSectionOrder,
  hideSection,
  moveInSectionOrder,
  sectionHasContent,
  showSection,
} from "@/lib/section-prefs";

export interface PopoverAnchor {
  top: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

const POP_WIDTH = 340;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

/* ── Primitives ─────────────────────────────────────────────────────────── */

const inputCls =
  "w-full px-2 py-1.5 rounded-md border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-xs text-gray-900 dark:text-white outline-none focus:border-cyan-500/60 placeholder:text-gray-400 dark:placeholder:text-slate-600";
const labelCls = "block text-[10px] font-medium text-gray-500 dark:text-slate-400 mb-1";
const btnQuiet =
  "inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer";
const btnPrimary =
  "px-2.5 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-medium cursor-pointer";

function PopField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  type = "text",
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  type?: string;
  invalid?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        className={`${inputCls} ${invalid ? "border-red-400/70" : ""}`}
      />
    </label>
  );
}

function PopTextarea({
  label,
  value,
  onChange,
  rows = 3,
  autoFocus,
  textareaRef,
  onKeyDown,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  autoFocus?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  const lineCount = value ? value.split("\n").length : 1;
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <textarea
        ref={textareaRef}
        value={value}
        rows={Math.max(rows, Math.min(8, lineCount))}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={`${inputCls} resize-none leading-relaxed`}
      />
    </label>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />;
}

/* ── AI suggestion box (Accept / Edit / Reject — never silent) ──────────── */

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; suggestion: string }
  | { status: "error"; message: string };

function SuggestionBox({
  state,
  onAccept,
  onEdit,
  onReject,
  onRetry,
}: {
  state: AiState;
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
  onRetry?: () => void;
}) {
  if (state.status === "idle") return null;
  if (state.status === "loading") {
    return (
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5 text-[11px] text-blue-700 dark:text-blue-300 animate-pulse">
        Writing a suggestion from your own text…
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-2.5 text-[11px] text-red-600 dark:text-red-300">
        {state.message}
        {onRetry && (
          <button type="button" onClick={onRetry} className={btnQuiet + " ml-2"}>
            Retry
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-2.5 space-y-2">
      <p className="text-[10px] text-purple-700 dark:text-purple-300 flex items-center gap-1">
        <Sparkles className="w-3 h-3" aria-hidden="true" />
        Suggestion — generated from your own text. Nothing is applied until
        you choose.
      </p>
      <p className="text-xs text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
        {state.suggestion}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium cursor-pointer"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 dark:border-white/[0.12] text-[11px] font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] cursor-pointer"
        >
          <Pencil className="w-3 h-3" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

/* ── The popover ────────────────────────────────────────────────────────── */

export function InlinePopover({
  target,
  anchor,
  onRetarget,
  onClose,
}: {
  target: InlineTarget;
  anchor: PopoverAnchor;
  onRetarget: (t: InlineTarget) => void;
  onClose: () => void;
}) {
  const resume = useResumeBuilder((s) => s.resume);
  const setResume = useResumeBuilder((s) => s.setResume);
  const updateField = useResumeBuilder((s) => s.updateField);
  const updateSocial = useResumeBuilder((s) => s.updateSocial);
  const updateExperience = useResumeBuilder((s) => s.updateExperience);
  const updateEducation = useResumeBuilder((s) => s.updateEducation);
  const updateSkill = useResumeBuilder((s) => s.updateSkill);
  const moveSkill = useResumeBuilder((s) => s.moveSkill);
  const removeSkill = useResumeBuilder((s) => s.removeSkill);
  const updateProject = useResumeBuilder((s) => s.updateProject);
  const setSectionPrefs = useResumeBuilder((s) => s.setSectionPrefs);
  const setActiveSection = useResumeBuilder((s) => s.setActiveSection);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const writeConflict = useResumeBuilder((s) => s.writeConflict);
  const plan = useResumePlan();
  const isMobile = useIsMobile();

  // Snapshot taken once per open (lazy state initializer — runs on mount
  // only): Escape restores it (cancel the active edit), Done keeps
  // everything the user typed.
  const [snapshot] = useState(() => structuredClone(resume));

  const [aiState, setAiState] = useState<AiState>({ status: "idle" });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingApply = useRef<((s: string) => void) | null>(null);

  const cancel = () => {
    setResume(snapshot);
    onClose();
  };

  // Escape cancels the active edit everywhere in the popover.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  // M5E — when the popover closes (Done or Escape), focus returns to the
  // field control that opened it instead of falling back to <body>.
  // Captured in the lazy initializer — during the FIRST render — because this
  // popover autofocusses its own textarea during commit, which would beat any
  // post-mount effect to document.activeElement.
  const [opener] = useState<HTMLElement | null>(
    () => document.activeElement as HTMLElement | null,
  );
  useEffect(() => {
    return () => {
      if (opener && opener.isConnected) opener.focus();
    };
  }, [opener]);

  const position = useMemo<React.CSSProperties>(() => {
    if (isMobile) {
      return { left: 0, right: 0, bottom: 0, width: "100%", maxHeight: "70vh" };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(8, anchor.left), Math.max(8, vw - POP_WIDTH - 8));
    const belowTop = anchor.bottom + 8;
    const top = belowTop + 300 > vh ? Math.max(8, anchor.top - 308) : belowTop;
    return { position: "fixed", left, top, width: POP_WIDTH, maxHeight: "min(70vh, 480px)" };
  }, [anchor, isMobile]);

  /* ── shared behaviors ── */

  const focusTextarea = () =>
    requestAnimationFrame(() => textareaRef.current?.focus());

  const runRewrite = async (
    text: string,
    apply: (suggestion: string) => void,
    tone?: "impact",
  ) => {
    if (!text.trim()) return;
    setAiState({ status: "loading" });
    try {
      const result = await ai.rewrite(text, tone);
      setAiState({ status: "done", suggestion: result.content });
      pendingApply.current = apply;
    } catch {
      setAiState({ status: "error", message: "AI request failed. Please try again." });
    }
  };

  const acceptSuggestion = () => {
    if (aiState.status === "done" && pendingApply.current) pendingApply.current(aiState.suggestion);
    setAiState({ status: "idle" });
    pendingApply.current = null;
  };
  const editSuggestion = () => {
    if (aiState.status === "done" && pendingApply.current) pendingApply.current(aiState.suggestion);
    setAiState({ status: "idle" });
    pendingApply.current = null;
    focusTextarea();
  };
  const rejectSuggestion = () => {
    setAiState({ status: "idle" });
    pendingApply.current = null;
  };

  /* ── editors per target kind ── */

  const renderHeaderEditor = () => {
    const fields: Array<{ key: "name" | "title" | "email" | "phone" | "address"; label: string; placeholder?: string; type?: string }> = [
      { key: "name", label: "Full name", placeholder: "Alex Johnson" },
      { key: "title", label: "Professional title", placeholder: "Senior Software Engineer" },
      { key: "email", label: "Email", placeholder: "alex@example.com", type: "email" },
      { key: "phone", label: "Phone", placeholder: "+1 (415) 555-0100" },
      { key: "address", label: "Location", placeholder: "San Francisco, CA" },
    ];
    return (
      <>
        <PopoverTitle title="Contact details" />
        <div className="space-y-2.5">
          {fields.map((f) => (
            <PopField
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              type={f.type}
              autoFocus={target.kind === "header" && target.field === f.key}
              value={resume[f.key] ?? ""}
              onChange={(v) => updateField(f.key, v)}
            />
          ))}
        </div>
      </>
    );
  };

  const renderSummaryEditor = () => (
    <>
      <PopoverTitle title="Professional summary" />
      <div className="space-y-2.5">
        <PopTextarea
          label="Summary"
          rows={6}
          autoFocus
          textareaRef={textareaRef}
          value={resume.summary}
          onChange={(v) => updateField("summary", v)}
          placeholder="Write 2–4 lines describing your experience, strengths, and the role you're targeting."
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onClose();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            className={btnQuiet}
            disabled={aiState.status === "loading" || !resume.summary.trim()}
            onClick={() =>
              runRewrite(resume.summary, (s) => updateField("summary", s))
            }
          >
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            {aiState.status === "loading" ? "Improving…" : "Improve with AI"}
          </button>
          <span className="text-[10px] text-gray-400 dark:text-slate-500">
            {resume.summary.length} chars
          </span>
        </div>
        <SuggestionBox
          state={aiState}
          onAccept={acceptSuggestion}
          onEdit={editSuggestion}
          onReject={rejectSuggestion}
          onRetry={() =>
            runRewrite(resume.summary, (s) => updateField("summary", s))
          }
        />
      </div>
    </>
  );

  const renderSocialEditor = () => {
    if (target.kind !== "social") return null;
    const key = target.key;
    const labels: Record<string, string> = {
      linkedin: "LinkedIn",
      github: "GitHub",
      website: "Website",
      portfolio: "Portfolio link",
      twitter: "Twitter / X",
      stackoverflow: "Stack Overflow",
    };
    const value = resume.social?.[key] ?? "";
    const check = validateWebUrl(value);
    const href = safeHref(value);
    return (
      <>
        <PopoverTitle title={labels[key] ?? key} />
        <div className="space-y-2.5">
          <PopField
            label="Link"
            autoFocus
            type="url"
            placeholder="example.com/yourprofile"
            value={value}
            invalid={!check.valid}
            onChange={(v) => updateSocial(key, v)}
          />
          {!check.valid && (
            <p className="text-[11px] text-red-500 dark:text-red-400">{check.message}</p>
          )}
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            Rendered as a real clickable link in the preview, PDF and DOCX.
          </p>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-400 hover:underline"
            >
              <Link2 className="w-3 h-3" aria-hidden="true" />
              Open link
            </a>
          )}
        </div>
      </>
    );
  };

  const renderExperienceEditor = () => {
    if (target.kind !== "experience") return null;
    const exp = resume.experience.find((e) => e.id === target.expId);
    if (!exp) return null;
    const bullets = exp.bulletPoints ?? [];
    const setBullets = (next: string[]) =>
      updateExperience(exp.id, "bulletPoints", next);
    return (
      <>
        <PopoverTitle title="Experience" />
        <div className="space-y-2.5">
          <PopField
            label="Job title"
            autoFocus
            value={exp.position}
            onChange={(v) => updateExperience(exp.id, "position", v)}
          />
          <PopField
            label="Company"
            value={exp.company}
            onChange={(v) => updateExperience(exp.id, "company", v)}
          />
          <div className="grid grid-cols-2 gap-2">
            <PopField
              label="Start"
              placeholder="2021-06"
              value={exp.startDate}
              onChange={(v) => updateExperience(exp.id, "startDate", v)}
            />
            <PopField
              label="End"
              placeholder="Present"
              value={exp.endDate}
              onChange={(v) => updateExperience(exp.id, "endDate", v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PopField
              label="Location"
              value={exp.location}
              onChange={(v) => updateExperience(exp.id, "location", v)}
            />
            <PopField
              label="Type"
              placeholder="Full-time"
              value={exp.employmentType}
              onChange={(v) => updateExperience(exp.id, "employmentType", v)}
            />
          </div>
          {target.part === "description" && (
            <PopTextarea
              label="Description"
              rows={4}
              autoFocus
              textareaRef={textareaRef}
              value={exp.description}
              onChange={(v) => updateExperience(exp.id, "description", v)}
            />
          )}
        </div>

        <Divider />
        <div className="flex items-center justify-between">
          <span className={labelCls + " mb-0"}>Bullets ({bullets.length})</span>
          <button
            type="button"
            className={btnQuiet}
            onClick={() => {
              setBullets([...bullets, ""]);
              onRetarget({ kind: "bullet", expId: exp.id, index: bullets.length });
            }}
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            Add bullet
          </button>
        </div>
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {bullets.map((b, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left text-[11px] text-gray-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 truncate rounded px-1.5 py-1 hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer"
                onClick={() => onRetarget({ kind: "bullet", expId: exp.id, index: i })}
              >
                • {b || "(empty bullet)"}
              </button>
            </li>
          ))}
          {bullets.length === 0 && (
            <li className="text-[11px] text-gray-400 dark:text-slate-500 px-1.5 py-1">
              No bullets yet — add the first one.
            </li>
          )}
        </ul>
      </>
    );
  };

  const renderBulletEditor = (projectMode: boolean) => {
    const exp =
      target.kind === "bullet"
        ? resume.experience.find((e) => e.id === target.expId)
        : undefined;
    const proj =
      target.kind === "project-bullet"
        ? resume.projects.find((p) => p.id === target.projectId)
        : undefined;
    const index = target.kind === "bullet" ? target.index : target.kind === "project-bullet" ? target.index : -1;
    const owner = (exp?.bulletPoints ?? proj?.bulletPoints ?? []) as string[];
    const value = owner[index] ?? "";
    const isProject = projectMode || !!proj;

    const setValue = (next: string[]) => {
      if (isProject && proj) updateProject(proj.id, "bulletPoints", next);
      else if (exp) updateExperience(exp.id, "bulletPoints", next);
    };
    const retarget = (i: number) => {
      if (isProject && proj) onRetarget({ kind: "project-bullet", projectId: proj.id, index: i });
      else if (exp) onRetarget({ kind: "bullet", expId: exp.id, index: i });
    };

    if (index < 0) return null;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const next = [...owner];
        next.splice(index + 1, 0, "");
        setValue(next);
        retarget(index + 1);
        focusTextarea();
      } else if (e.key === "Backspace" && value === "" && owner.length > 1) {
        e.preventDefault();
        const next = owner.filter((_, i) => i !== index);
        setValue(next);
        const targetIdx = Math.max(0, index - 1);
        retarget(targetIdx);
        focusTextarea();
      }
    };

    const move = (dir: -1 | 1) => {
      const to = index + dir;
      if (to < 0 || to >= owner.length) return;
      const next = [...owner];
      const [moved] = next.splice(index, 1);
      next.splice(to, 0, moved);
      setValue(next);
      retarget(to);
    };

    return (
      <>
        <PopoverTitle title={isProject ? "Project bullet" : "Bullet"} />
        <div className="space-y-2.5">
          <PopTextarea
            label="Bullet"
            rows={2}
            autoFocus
            textareaRef={textareaRef}
            value={value}
            onChange={(v) => {
              const next = [...owner];
              next[index] = v;
              setValue(next);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Describe an achievement or responsibility…"
          />
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            Enter adds a bullet below · Backspace on an empty bullet removes it ·
            Escape cancels
          </p>

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              className={btnQuiet}
              onClick={() => move(-1)}
              disabled={index === 0}
              aria-label="Move bullet up"
            >
              <ChevronUp className="w-3 h-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={btnQuiet}
              onClick={() => move(1)}
              disabled={index >= owner.length - 1}
              aria-label="Move bullet down"
            >
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={btnQuiet}
              onClick={() => {
                const next = [...owner];
                next.splice(index + 1, 0, value);
                setValue(next);
                retarget(index + 1);
                focusTextarea();
              }}
              aria-label="Duplicate bullet"
            >
              <Copy className="w-3 h-3" aria-hidden="true" />
              Duplicate
            </button>
            <button
              type="button"
              className={btnQuiet + " hover:!text-red-500"}
              onClick={() => {
                setValue(owner.filter((_, i) => i !== index));
                if (owner.length <= 1) onClose();
                else {
                  retarget(Math.max(0, index - 1));
                  focusTextarea();
                }
              }}
              aria-label="Delete bullet"
            >
              <Trash2 className="w-3 h-3" aria-hidden="true" />
              Delete
            </button>
            <span className="flex-1" />
            <button
              type="button"
              className={btnQuiet}
              disabled={aiState.status === "loading" || !value.trim()}
              onClick={() =>
                runRewrite(
                  value,
                  (s) => {
                    const next = [...owner];
                    next[index] = s;
                    setValue(next);
                  },
                  "impact",
                )
              }
              aria-label="Improve bullet with AI"
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              {aiState.status === "loading" ? "Improving…" : "Improve"}
            </button>
          </div>

          <SuggestionBox
            state={aiState}
            onAccept={acceptSuggestion}
            onEdit={editSuggestion}
            onReject={rejectSuggestion}
            onRetry={() =>
              runRewrite(
                value,
                (s) => {
                  const next = [...owner];
                  next[index] = s;
                  setValue(next);
                },
                "impact",
              )
            }
          />
        </div>
      </>
    );
  };

  const renderEducationEditor = () => {
    if (target.kind !== "education") return null;
    const edu = resume.education.find((e) => e.id === target.eduId);
    if (!edu) return null;
    return (
      <>
        <PopoverTitle title="Education" />
        <div className="space-y-2.5">
          <PopField
            label="School"
            autoFocus
            value={edu.school}
            onChange={(v) => updateEducation(edu.id, "school", v)}
          />
          <div className="grid grid-cols-2 gap-2">
            <PopField
              label="Degree"
              value={edu.degree}
              onChange={(v) => updateEducation(edu.id, "degree", v)}
            />
            <PopField
              label="Field"
              value={edu.field}
              onChange={(v) => updateEducation(edu.id, "field", v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PopField
              label="Year"
              placeholder="2015 – 2019"
              value={edu.year}
              onChange={(v) => updateEducation(edu.id, "year", v)}
            />
            <PopField
              label="GPA"
              placeholder="3.8"
              value={edu.gpa}
              onChange={(v) => updateEducation(edu.id, "gpa", v)}
            />
          </div>
          <PopField
            label="Honors"
            placeholder=" magna cum laude"
            value={edu.honors}
            onChange={(v) => updateEducation(edu.id, "honors", v)}
          />
          <PopField
            label="Location"
            value={edu.location}
            onChange={(v) => updateEducation(edu.id, "location", v)}
          />
        </div>
      </>
    );
  };

  const renderSkillEditor = () => {
    if (target.kind !== "skill") return null;
    const skill = resume.skills.find((s) => s.id === target.skillId);
    if (!skill) return null;
    const idx = resume.skills.findIndex((s) => s.id === target.skillId);
    return (
      <>
        <PopoverTitle title="Skill" />
        <div className="space-y-2.5">
          <PopField
            label="Name"
            autoFocus
            value={skill.name}
            onChange={(v) => updateSkill(skill.id, "name", v)}
          />
          <label className="block">
            <span className={labelCls}>Level</span>
            <select
              value={skill.level}
              onChange={(e) => updateSkill(skill.id, "level", e.target.value)}
              className={inputCls}
            >
              {["Beginner", "Intermediate", "Advanced", "Expert"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={btnQuiet}
              disabled={idx <= 0}
              onClick={() => moveSkill(skill.id, -1)}
              aria-label="Move skill up"
            >
              <ChevronUp className="w-3 h-3" aria-hidden="true" />
              Move up
            </button>
            <button
              type="button"
              className={btnQuiet}
              disabled={idx >= resume.skills.length - 1}
              onClick={() => moveSkill(skill.id, 1)}
              aria-label="Move skill down"
            >
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
              Move down
            </button>
            <span className="flex-1" />
            <button
              type="button"
              className={btnQuiet + " hover:!text-red-500"}
              onClick={() => {
                removeSkill(skill.id);
                onClose();
              }}
              aria-label="Delete skill"
            >
              <Trash2 className="w-3 h-3" aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderProjectEditor = () => {
    if (target.kind !== "project") return null;
    const proj = resume.projects.find((p) => p.id === target.projectId);
    if (!proj) return null;
    const bullets = proj.bulletPoints ?? [];
    const linkCheck = validateWebUrl(proj.link);
    return (
      <>
        <PopoverTitle title="Project" />
        <div className="space-y-2.5">
          <PopField
            label="Name"
            autoFocus
            value={proj.name}
            onChange={(v) => updateProject(proj.id, "name", v)}
          />
          <div className="grid grid-cols-2 gap-2">
            <PopField
              label="Role"
              value={proj.role}
              onChange={(v) => updateProject(proj.id, "role", v)}
            />
            <PopField
              label="Tech"
              value={proj.tech}
              onChange={(v) => updateProject(proj.id, "tech", v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PopField
              label="Start"
              value={proj.startDate}
              onChange={(v) => updateProject(proj.id, "startDate", v)}
            />
            <PopField
              label="End"
              value={proj.endDate}
              onChange={(v) => updateProject(proj.id, "endDate", v)}
            />
          </div>
          <PopField
            label="Link"
            type="url"
            placeholder="example.com/project"
            value={proj.link}
            invalid={!linkCheck.valid}
            onChange={(v) => updateProject(proj.id, "link", v)}
          />
          {!linkCheck.valid && (
            <p className="text-[11px] text-red-500 dark:text-red-400">
              {linkCheck.message}
            </p>
          )}
          {target.part === "description" && (
            <PopTextarea
              label="Description"
              rows={4}
              autoFocus
              textareaRef={textareaRef}
              value={proj.description}
              onChange={(v) => updateProject(proj.id, "description", v)}
            />
          )}
        </div>

        <Divider />
        <div className="flex items-center justify-between">
          <span className={labelCls + " mb-0"}>Bullets ({bullets.length})</span>
          <button
            type="button"
            className={btnQuiet}
            onClick={() => {
              updateProject(proj.id, "bulletPoints", [...bullets, ""]);
              onRetarget({ kind: "project-bullet", projectId: proj.id, index: bullets.length });
            }}
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            Add bullet
          </button>
        </div>
        <ul className="space-y-1 max-h-32 overflow-y-auto">
          {bullets.map((b, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left text-[11px] text-gray-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 truncate rounded px-1.5 py-1 hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer"
                onClick={() => onRetarget({ kind: "project-bullet", projectId: proj.id, index: i })}
              >
                • {b || "(empty bullet)"}
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  };

  const renderSectionEditor = () => {
    if (target.kind !== "section") return null;
    const key: ResumeSectionKey = target.section;
    const prefs: SectionPrefs = resume.sectionPrefs ?? {};
    const hiddenSet = new Set(prefs.hidden ?? []);
    const visibleOrder = plan.sections.map((s) => s.type as ResumeSectionKey);
    const view = computeSectionOrder(resume, visibleOrder, prefs);
    const isHidden = hiddenSet.has(key);
    const pos = view.order.indexOf(key);
    const hasContent = sectionHasContent(resume, key);
    const editorSection: SectionId | undefined = SECTION_META[key].editorSection;

    const commit = (next: SectionPrefs) => setSectionPrefs(next);
    return (
      <>
        <PopoverTitle title={SECTION_META[key].label} />
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            Applies to this resume version only — your Master Profile keeps its
            own section order.
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              className={btnQuiet}
              disabled={pos <= 0}
              onClick={() =>
                commit({
                  order: moveInSectionOrder(view.order, key, -1),
                  ...(prefs.hidden?.length ? { hidden: prefs.hidden } : {}),
                })
              }
              aria-label={`Move ${SECTION_META[key].label} up`}
            >
              <ChevronUp className="w-3 h-3" aria-hidden="true" />
              Move up
            </button>
            <button
              type="button"
              className={btnQuiet}
              disabled={pos < 0 || pos >= view.order.length - 1}
              onClick={() =>
                commit({
                  order: moveInSectionOrder(view.order, key, 1),
                  ...(prefs.hidden?.length ? { hidden: prefs.hidden } : {}),
                })
              }
              aria-label={`Move ${SECTION_META[key].label} down`}
            >
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
              Move down
            </button>
            <span className="flex-1" />
            {hasContent && (
              <button
                type="button"
                className={btnQuiet}
                disabled={!isHidden && visibleOrder.length <= 1}
                aria-pressed={isHidden}
                onClick={() =>
                  commit(
                    isHidden
                      ? showSection(prefs, view.order, key)
                      : hideSection(prefs, view.order, key),
                  )
                }
                aria-label={isHidden ? "Show section" : "Hide section"}
              >
                {isHidden ? (
                  <>
                    <EyeOff className="w-3 h-3" aria-hidden="true" />
                    Show
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" aria-hidden="true" />
                    Hide
                  </>
                )}
              </button>
            )}
          </div>
          {editorSection && (
            <button
              type="button"
              className={btnQuiet + " w-full justify-center"}
              onClick={() => {
                setActiveSection(editorSection);
                onClose();
              }}
            >
              Edit {SECTION_META[key].label.toLowerCase()} in the editor
            </button>
          )}
        </div>
      </>
    );
  };

  const renderBody = () => {
    switch (target.kind) {
      case "header":
        return renderHeaderEditor();
      case "summary":
        return renderSummaryEditor();
      case "social":
        return renderSocialEditor();
      case "experience":
        return renderExperienceEditor();
      case "bullet":
        return renderBulletEditor(false);
      case "project-bullet":
        return renderBulletEditor(true);
      case "education":
        return renderEducationEditor();
      case "skill":
        return renderSkillEditor();
      case "project":
        return renderProjectEditor();
      case "section":
        return renderSectionEditor();
      default:
        return null;
    }
  };

  // M5B: the popover's save chip mirrors the header indicator's truth —
  // including the 409 conflict state (derived from `writeConflict`).
  const saveState = writeConflict ? "conflict" : saveStatus;
  const saveLabel =
    saveState === "saved"
      ? "Saved"
      : saveState === "saving"
        ? "Saving…"
        : saveState === "offline"
          ? "Offline"
          : saveState === "sync-failed"
            ? "Save failed"
          : saveState === "conflict"
            ? "Conflict"
            : "Unsaved changes";

  return (
    <div
      role="dialog"
      aria-label="Edit resume content"
      data-testid="inline-popover"
      className={
        isMobile
          ? "fixed left-0 right-0 bottom-0 z-[95] rounded-t-2xl border-t border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1222] shadow-[0_-8px_30px_rgba(0,0,0,0.25)] flex flex-col"
          : "fixed z-[95] rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1222] shadow-2xl flex flex-col"
      }
      style={position}
      onKeyDown={(e) => {
        // Keep Tab inside the popover while it is open (a11y).
        if (e.key !== "Tab") return;
        const root = e.currentTarget;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="px-3 pt-2.5 pb-2 overflow-y-auto">{renderBody()}</div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 dark:border-white/[0.06] shrink-0">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400"
          data-testid="inline-popover-save-state"
          data-save-status={saveState}
        >
          <span
            aria-hidden="true"
            className={
              "w-1.5 h-1.5 rounded-full " +
              (saveState === "saved"
                ? "bg-emerald-500"
                : saveState === "saving"
                  ? "bg-cyan-500 animate-pulse"
                  : saveState === "conflict"
                    ? "bg-violet-500"
                    : saveState === "sync-failed"
                      ? "bg-rose-500"
                      : "bg-amber-500")
            }
          />
          {saveLabel}
          {(saveState === "sync-failed" || saveState === "offline") && (
            <button
              type="button"
              onClick={() => void retryFailedSave()}
              aria-label="Retry save"
              className="ml-0.5 rounded border border-gray-300 dark:border-white/15 px-1.5 py-px text-[10px] font-medium text-gray-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-cyan-500"
            >
              Retry
            </button>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={cancel}
            className="px-2.5 py-1.5 rounded-md text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            Cancel
          </button>
          <button type="button" onClick={onClose} className={btnPrimary}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function PopoverTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <h4 className="text-xs font-semibold text-gray-900 dark:text-white">{title}</h4>
      <span className="text-[9px] uppercase tracking-wider text-gray-400 dark:text-slate-500">
        this resume
      </span>
    </div>
  );
}
