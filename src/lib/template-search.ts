import type { ResumeTemplate } from "@/app/resume-builder/templates";

/**
 * All axes a future filter story can populate — add fields here, not in filterTemplates().
 * Only `query` is used now; the rest are stubs ready for 5.1E onward.
 */
export interface TemplateSearchFilters {
  query: string;
  // Future: category sidebar (5.1E)
  category?: string;
  // Future: ATS threshold slider
  minAtsScore?: number;
  // Future: experience level chip
  experienceLevel?: string;
  // Future: industry tag cloud (Engineering, Marketing, Finance, Healthcare…)
  industry?: string;
  // Future: "Premium only" toggle
  premiumOnly?: boolean;
  // Future: AI recommended set (pass IDs from recommendation engine)
  recommendedIds?: string[];
  // Future: recently used / favorite IDs
  pinnedIds?: string[];
}

/**
 * Per-template semantic keywords.
 * Source of truth for text search — kept here, not duplicated across components.
 * To add industry keywords for 5.1E+, append strings to the relevant array.
 */
const TEMPLATE_TAGS: Record<string, readonly string[]> = {
  "executive":            ["executive", "leadership", "senior", "professional", "corporate", "serif", "bold", "management", "c-suite"],
  "modern-clean":         ["modern", "clean", "minimal", "tech", "sleek", "simple", "white", "professional"],
  "split-vibrant":        ["creative", "vibrant", "colorful", "two-column", "sidebar", "design", "visual", "bold"],
  "classic-serif":        ["classic", "traditional", "serif", "formal", "academic", "professional", "law", "finance", "timeless"],
  "tech-mono":            ["tech", "mono", "monospace", "developer", "code", "engineering", "minimal", "dark"],
  "creative-burst":       ["creative", "colorful", "burst", "design", "portfolio", "vibrant", "artistic", "expressive"],
  "compact-pro":          ["compact", "dense", "professional", "devops", "engineering", "technical", "condensed"],
  "corporate-blue":       ["corporate", "blue", "professional", "formal", "business", "enterprise", "senior"],
  "minimal-edge":         ["minimal", "edge", "clean", "simple", "modern", "white", "airy", "elegant"],
  "banner-bold":          ["banner", "bold", "fresh", "entry", "graduate", "junior", "vibrant", "modern"],
  "sidebar-elegance":     ["sidebar", "elegant", "design", "creative", "two-column", "visual", "refined"],
  "gradient-flow":        ["gradient", "modern", "ai", "ml", "data", "tech", "flow", "colorful"],
  "academic-formal":      ["academic", "formal", "research", "phd", "scholar", "data", "science", "traditional", "classic"],
  "startup-vibe":         ["startup", "fresh", "modern", "energetic", "entry", "graduate", "tech", "casual"],
  "dark-elegance":        ["dark", "elegant", "cybersecurity", "security", "professional", "premium", "sleek"],
  "timeline-pro":         ["timeline", "chronological", "professional", "modern", "clean", "tech"],
  "premium-slate":        ["premium", "slate", "sophisticated", "professional", "executive", "dark", "modern"],
  "nature-green":         ["nature", "green", "fresh", "sustainability", "data", "science", "calm", "clean"],
  "luxury-gold":          ["luxury", "gold", "premium", "executive", "elegant", "upscale", "refined", "leadership"],
  "swiss-design":         ["swiss", "minimal", "grid", "clean", "design", "devops", "structured", "precise"],
  "scientific":           ["scientific", "academic", "research", "data", "formal", "precise", "professional", "phd"],
  "creative-portfolio":   ["creative", "portfolio", "design", "artistic", "visual", "colorful", "expressive"],
};

/** Build a pre-lowercased searchable string for a template — computed once per template. */
function buildSearchCorpus(t: ResumeTemplate): string {
  const atsTier =
    t.atsRating > 90 ? "ats high ats-friendly ats friendly" :
    t.atsRating > 80 ? "ats good ats-friendly" :
    "ats";
  const tags = TEMPLATE_TAGS[t.id] ?? [];
  return [
    t.name,
    t.description,
    t.category,
    t.experienceLevel,
    t.layout,
    atsTier,
    ...tags,
  ].join(" ").toLowerCase();
}

/**
 * Pre-built corpus cache — each template's searchable string is computed once
 * at module load, not on every keystroke. Safe for 100+ templates.
 */
const CORPUS_CACHE = new Map<string, string>();

function getCorpus(t: ResumeTemplate): string {
  let c = CORPUS_CACHE.get(t.id);
  if (!c) {
    c = buildSearchCorpus(t);
    CORPUS_CACHE.set(t.id, c);
  }
  return c;
}

/** Returns true if all tokens in the query appear somewhere in the template corpus. */
function matchesQuery(t: ResumeTemplate, query: string): boolean {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const corpus = getCorpus(t);
  return tokens.every((tok) => corpus.includes(tok));
}

/**
 * Main filter function. Add new filter axes here as future stories land;
 * the call signature (filters object) never needs to change at the call site.
 */
export function filterTemplates(
  templates: readonly ResumeTemplate[],
  filters: TemplateSearchFilters
): ResumeTemplate[] {
  return templates.filter((t) => {
    if (filters.query && !matchesQuery(t, filters.query)) return false;
    if (filters.category && filters.category !== "All" && t.category !== filters.category) return false;
    if (filters.minAtsScore != null && t.atsRating < filters.minAtsScore) return false;
    if (filters.experienceLevel && t.experienceLevel !== filters.experienceLevel) return false;
    // filters.industry, filters.premiumOnly, filters.recommendedIds, filters.pinnedIds
    // are stubs — implement in the story that introduces them.
    return true;
  });
}

export const DEFAULT_FILTERS: TemplateSearchFilters = {
  query: "",
};
