import type { Resume } from "@/types/resume";

/**
 * Markers that mean a date range is open-ended on the right.
 */
const PRESENT_RE =
  /\b(?:present|current|now|ongoing|today|to\s*date)\b/i;

function isDateLike(value: string): boolean {
  return (
    /\b\d{4}\b/.test(value) ||
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i.test(value)
  );
}

/**
 * Parse a `CompanyGrouped`-style combined duration range ("Apr 2024 – Present",
 * "Jan 2020 - Mar 2023") into explicit startDate/endDate. Returns null when the
 * string is not a two-part date range, so the caller keeps `duration` untouched.
 */
function splitDurationRange(time: string): { startDate: string; endDate: string } | null {
  const parts = time.split(/\s*(?:–|—|—|~|to|-)\s*/i).filter((p) => p.length > 0);
  if (parts.length !== 2) return null;
  const [start, end] = parts;
  if (!isDateLike(start)) return null;
  if (PRESENT_RE.test(end)) return { startDate: start.trim(), endDate: "Present" };
  if (!isDateLike(end)) return null;
  return { startDate: start.trim(), endDate: end.trim() };
}

/**
 * Back-fill experience `startDate`/`endDate` from the combined `duration` the
 * deterministic grouping produces. Runs once at the boundary where imported
 * data enters the builder; it never mutates grouping/import code and leaves an
 * existing explicit date alone.
 */
export function normalizeImportedResume(resume: Resume): Resume {
  if (!resume.experience.length) return resume;
  return {
    ...resume,
    experience: resume.experience.map((exp) => {
      if ((exp.startDate || exp.endDate) || !exp.duration) {
        return exp;
      }
      const split = splitDurationRange(exp.duration);
      if (!split) return exp;
      return { ...exp, ...split };
    }),
  };
}