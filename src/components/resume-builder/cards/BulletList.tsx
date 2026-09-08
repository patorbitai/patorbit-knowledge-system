"use client";

import { useRef, useState, useMemo } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { FONT_OPTIONS, DEFAULT_STYLE_CONFIG, type ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import { fontFamilies } from "@/lib/resume-design-system/fonts";

interface BulletListProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  /** Contextual AI improvement for a single bullet. Returns the improved text. */
  onImprove?: (text: string, index: number) => Promise<string> | void;
  placeholder?: string;
  className?: string;
}

/** Resolve the CSS font-family string from a stored style config. */
function resolveFontFamily(stored?: ResumeStyleConfig): string {
  const config = stored ?? DEFAULT_STYLE_CONFIG;
  const option = FONT_OPTIONS.find((f) => f.id === config.fontFamily);
  return option?.stack ?? fontFamilies.sans;
}

/**
 * BulletList — bullets as real, independently editable objects.
 *
 * Content-first: bullets render as plain rows; controls appear only on
 * hover/focus. Keyboard behavior:
 *   - Enter        → create a new bullet below
 *   - Backspace on an empty bullet → remove it and focus the previous one
 *   - Tab/arrows   → natural focus flow
 */
export function BulletList({ bullets, onChange, onImprove, placeholder = "Describe an achievement or responsibility…", className }: BulletListProps) {
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [improvingIdx, setImprovingIdx] = useState<number | null>(null);

  // Read the active resume's font from the store so the editor uses the same typeface as the preview.
  const styleConfig = useResumeBuilder((s) => s.styleConfigs[s.activeResumeId]);
  const fontFamily = useMemo(() => resolveFontFamily(styleConfig), [styleConfig]);

  const update = (index: number, value: string) => {
    const next = [...bullets];
    next[index] = value;
    onChange(next);
  };

  const addAfter = (index: number) => {
    const next = [...bullets];
    next.splice(index + 1, 0, "");
    onChange(next);
    requestAnimationFrame(() => inputRefs.current[index + 1]?.focus());
  };

  const remove = (index: number) => {
    const next = bullets.filter((_, i) => i !== index);
    onChange(next);
    requestAnimationFrame(() => inputRefs.current[Math.max(0, index - 1)]?.focus());
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= bullets.length) return;
    const next = [...bullets];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addAfter(index);
    } else if (e.key === "Backspace" && bullets[index] === "" && bullets.length > 1) {
      e.preventDefault();
      remove(index);
    }
  };

  const handleImprove = async (index: number) => {
    if (!onImprove || improvingIdx !== null) return;
    const text = bullets[index];
    if (!text.trim()) return;
    setImprovingIdx(index);
    try {
      const result = await onImprove(text, index);
      if (typeof result === "string") update(index, result);
    } finally {
      setImprovingIdx(null);
    }
  };

  if (bullets.length === 0) {
    return (
      <div className={clsx("space-y-2", className)}>
        <button
          onClick={() => addAfter(-1)}
          className="w-full flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-white/[0.12] px-3 py-2.5 text-xs text-gray-400 dark:text-slate-500 hover:border-cyan-400/50 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {placeholder}
        </button>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-1", className)}>
      {bullets.map((bullet, index) => {
        const lineCount = bullet ? bullet.split("\n").length : 1;
        return (
          <div
            key={index}
            className="group/bullet flex items-start gap-2 rounded-lg px-2 py-1 -mx-2 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-gray-300 dark:text-slate-600 mt-2 shrink-0 text-xs select-none" aria-hidden>
              •
            </span>
            <textarea
              ref={(el) => { inputRefs.current[index] = el; }}
              value={bullet}
              onChange={(e) => update(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              rows={Math.min(6, lineCount)}
              placeholder={placeholder}
              aria-label={`Bullet ${index + 1}`}
              style={{ fontFamily }}
              className="w-full bg-transparent text-sm text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600 outline-none py-1 resize-none leading-relaxed"
            />
            {/* Hover/focus controls */}
            <div className="flex items-center gap-0.5 opacity-0 group-focus-within/bullet:opacity-100 group-hover/bullet:opacity-100 transition-opacity shrink-0 mt-0.5">
              {onImprove && (
                <button
                  onClick={() => handleImprove(index)}
                  disabled={improvingIdx === index || !bullet.trim()}
                  title="Improve with AI"
                  aria-label="Improve bullet with AI"
                  className="p-1 rounded-md text-gray-400 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 disabled:opacity-30"
                >
                  <Sparkles className={clsx("w-3 h-3", improvingIdx === index && "animate-pulse")} />
                </button>
              )}
              <button
                onClick={() => move(index, -1)}
                disabled={index === 0}
                title="Move up"
                aria-label="Move bullet up"
                className="p-1 rounded-md text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => move(index, 1)}
                disabled={index === bullets.length - 1}
                title="Move down"
                aria-label="Move bullet down"
                className="p-1 rounded-md text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => remove(index)}
                title="Delete bullet"
                aria-label="Delete bullet"
                className="p-1 rounded-md text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
      <button
        onClick={() => addAfter(bullets.length - 1)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
      >
        <Plus className="w-3 h-3" />
        Add bullet
      </button>
    </div>
  );
}
