import { TEMPLATES } from "@/app/resume-builder/templates";
import type { Resume } from "@/types/resume";

/** IDs of the 29 real resume templates. */
const KNOWN_TEMPLATE_IDS = new Set(TEMPLATES.map((t) => t.id));

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

/**
 * Content fields a resume import may legitimately carry. Everything else on
 * the user's resume — identity (resumeId/resumeName), template, career stage,
 * trust claims, and style preferences — is preserved unless the import
 * explicitly overrides it.
 */
const IMPORTED_CONTENT_FIELDS = [
  "name",
  "title",
  "email",
  "phone",
  "address",
  "nationality",
  "pronouns",
  "summary",
  "social",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "interests",
  "achievements",
  "references",
  "portfolio",
] as const satisfies readonly (keyof Resume)[];

/**
 * Merge an imported resume into the user's real resume.
 *
 * Content fields come from the import; everything the import cannot know about
 * (template, career stage, claims, style preferences, identity) is preserved
 * from the user's current resume. The user's template choice is kept unless
 * the import explicitly carried a real template id (e.g. a JSON file with
 * `templateId`). Parser/schema defaults ("template-1", which is not a real
 * template) never overwrite the user's current template. resumeId/resumeName
 * are additionally pinned by the store's setResume.
 */
export function mergeImportedResume(current: Resume, imported: Resume): Resume {
  const templateId = KNOWN_TEMPLATE_IDS.has(imported.templateId)
    ? imported.templateId
    : current.templateId;

  // Start from the user's resume so unrelated state (claims, career stage,
  // style prefs) survives; then apply only the importable content fields.
  const merged: Resume = { ...current };
  const target = merged as unknown as Record<string, unknown>;
  for (const field of IMPORTED_CONTENT_FIELDS) {
    target[field] = imported[field];
  }
  merged.templateId = templateId;
  return normalizeImportedResume(merged);
}