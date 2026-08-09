"use strict";

/**
 * Deterministic extractors for the Job Profile (M2).
 *
 * These functions extract ONLY what is literally present in the job
 * description text. They never synthesize, infer intent, or invent
 * requirements. Anything not matched by a rule is simply absent from the
 * output. The one exception — implicit competencies — is explicitly derived
 * from a curated phrase lexicon and always carries its exact context text.
 */

import { clean } from "@/lib/career-profile/extract";
import type { JobSeniorityLevel } from "@/types/job-profile";

/* ── Text utilities ─────────────────────────────────────────────────────── */

/** Normalize a JD line for matching (collapses whitespace). */
export function normalize(text: string): string {
  return clean(text);
}

/** Split raw JD text into non-empty, cleaned lines. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => clean(line))
    .filter(Boolean);
}

/** Split raw JD text into bullet items (bulleted lines or comma/pipe lists). */
export function splitBullets(text: string): string[] {
  const out: string[] = [];
  for (const line of splitLines(text)) {
    const bullet = line.replace(/^[-•*▪◦\d.)]+\s*/, "").trim();
    if (!bullet) continue;
    // Preserve whole bullet lines as-is; also expose inline lists.
    out.push(bullet);
    for (const part of bullet.split(/[,;|]+/)) {
      const trimmed = clean(part);
      if (trimmed && !out.includes(trimmed)) out.push(trimmed);
    }
  }
  return out;
}

/** Collapse whitespace and trim a single free-text value. */
export function cleanText(value: string | null | undefined): string {
  return clean(value);
}

/** Strip a leading bullet marker (e.g. "- ", "• ", "3. ") from a line. */
export function stripBulletMarker(line: string): string {
  return clean(line).replace(/^[-•*▪◦]\s*/, "").replace(/^\d+[.)]\s*/, "");
}

/* ── Heading detection ───────────────────────────────────────────────────── */

/** First line that looks like a job title heading (short, no ending period). */
export function extractTitle(lines: string[]): string | undefined {
  for (const line of lines) {
    const t = clean(line);
    if (!t || t.length > 80) continue;
    if (/[.!?]$/.test(t)) continue;
    if (/^(senior|lead|principal|staff|junior|mid|sr\.|jr\.)/i.test(t)) return t;
    // Heuristic: capitalized heading-like line among the first few.
    if (/^[A-Z][A-Za-z0-9 /&+-]{2,}$/.test(t)) return t;
  }
  return undefined;
}

/* ── Requirement / responsibility / qualification classification ─────────── */

const REQUIREMENT_RE = new RegExp(
  "\\b(must|should|shall|required|requires|requirement|ability to|experience with|expected to|responsible for ensuring you have|you have|you will have)\\b",
  "i",
);

const QUALIFICATION_RE = new RegExp(
  "\\b(degree|bachelor|master|phd|ph\\.d|diploma|certification|certified|licensed|years? of (experience|professional)|years? experience|X\\+\\s*years?)\\b",
  "i",
);

const ACTION_VERBS = [
  "develop", "build", "design", "lead", "manage", "own", "drive",
  "implement", "maintain", "improve", "create", "architect", "engineer",
  "collaborate", "partner", "mentor", "coach", "deliver", "ship",
  "operate", "support", "monitor", "optimize", "automate", "analyze",
  "review", "write", "communicate", "coordinate", "define", "own",
  "ensure", "help", "provide", "work", "handle", "run", "grow",
];

/** A bullet stating an explicit requirement. */
export function isRequirementLine(text: string): boolean {
  return REQUIREMENT_RE.test(text);
}

/** A bullet stating a qualification (education/cert/experience). */
export function isQualificationLine(text: string): boolean {
  return QUALIFICATION_RE.test(text);
}

/** A bullet that starts with a concrete action verb (responsibility). */
export function isResponsibilityLine(text: string): boolean {
  const first = (text.split(/\s/)[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  return ACTION_VERBS.includes(first);
}

/**
 * Classify a bullet into requirement / responsibility / qualification /
 * none. Pure rule-based; returns a stable label or "other".
 *
 * Precedence: explicit requirement keywords win over qualification phrasing
 * so that statements like "You must have 5+ years..." read as requirements.
 */
export function classifyLine(
  text: string,
): "requirement" | "responsibility" | "qualification" | "other" {
  const t = stripBulletMarker(text);
  if (isRequirementLine(t)) return "requirement";
  if (isQualificationLine(t)) return "qualification";
  if (isResponsibilityLine(t)) return "responsibility";
  return "other";
}

/* ── Skills ──────────────────────────────────────────────────────────────── */

const SKILL_SECTION_RE = /^\s*(skills|tech stack|technologies?|tools|required skills|key skills)\s*[:;]?\s*$/i;

const SKILL_LIST_RE = /^\s*(skills|tech stack|technologies?|tools|required skills|key skills)\s*[:;]\s*(.+)$/i;

/** Known technology/tool tokens used to tag otherwise-ambiguous list items. */
const TECH_TERMS = [
  "javascript", "typescript", "python", "java", "go", "golang", "rust",
  "c\\+\\+", "c#", "ruby", "php", "swift", "kotlin", "scala", "sql",
  "nosql", "postgres", "postgresql", "mysql", "mongodb", "redis", "graphql",
  "rest", "grpc", "docker", "kubernetes", "k8s", "aws", "azure", "gcp",
  "terraform", "react", "vue", "angular", "next\\.js", "node\\.js",
  "express", "django", "flask", "spring", "rails", "git", "linux", "bash",
  "html", "css", "sass", "tailwind", "redux", "jest", "cypress", "pytest",
  "kafka", "rabbitmq", "elasticsearch", "airflow", "spark", "hadoop",
  "pandas", "numpy", "tensorflow", "pytorch", "scikit-learn", "figma",
  "jira", "confluence", "snowflake", "databricks", "tableau", "powerbi",
  "excel", "word",
];

const TECH_TOKEN_RE = new RegExp(`\\b(${TECH_TERMS.join("|")})\\b`, "i");

/** Extract individual technology tokens literally present in a line. */
function extractTechTokens(text: string): string[] {
  const re = new RegExp(`\\b(${TECH_TERMS.join("|")})\\b`, "gi");
  const out: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const token = m[1];
    const key = token.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(token);
    }
  }
  return out;
}

/**
 * Extract explicit skills from a JD. Looks for a dedicated skills section and
 * for inline "Skills:" list lines; falls back to scanning bullet text for
 * known technology tokens. Never guesses — a token is a skill only when it is
 * literally present in the JD.
 */
export function extractSkills(lines: string[]): { name: string; sourceText: string }[] {
  const items: { name: string; sourceText: string }[] = [];
  const seen = new Set<string>();
  let inSection = false;

  const push = (name: string, sourceText: string) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ name, sourceText });
  };

  for (const line of lines) {
    const t = stripBulletMarker(line);
    if (!t) continue;
    if (SKILL_SECTION_RE.test(t)) {
      inSection = true;
      continue;
    }
    if (/^\s*(education|responsibilities|qualifications|about|who you are|what you'll do)\s*[:;]?$/i.test(t)) {
      inSection = false;
      continue;
    }

    const inline = t.match(SKILL_LIST_RE);
    if (inline) {
      inSection = false;
      for (const part of inline[2].split(/[,;|/]+/)) {
        const name = clean(part);
        if (name) push(name, t);
      }
      continue;
    }

    if (inSection) {
      for (const part of t.split(/[,;|/]+/)) {
        const name = clean(part);
        if (name && name.length <= 60) push(name, t);
      }
      continue;
    }

    // Fallback: pull out known technology tokens verbatim from prose lines.
    if (TECH_TOKEN_RE.test(t)) {
      for (const token of extractTechTokens(t)) push(token, t);
    }
  }

  return items;
}

/* ── Seniority ───────────────────────────────────────────────────────────── */

const SENIORITY_LEVEL_RE: [JobSeniorityLevel, RegExp][] = [
  ["Director", /\bdirector\b/i],
  ["Principal", /\bprincipal\b/i],
  ["Lead", /\blead\b|\bleading\b/i],
  ["Senior", /\bsenior\b|\bsr\.?\b/i],
  ["Mid", /\bmid(-|\s)?level\b/i],
  ["Junior", /\bjunior\b|\bjr\.?\b/i],
];

const YEARS_RE = /(\d{1,2})(?:\s*\+)?\s*(?:years?|yrs?)(?:\s*of)?(?:\s*experience)?/i;

/** Extract seniority signals (level + explicit years). */
export function extractSeniority(
  lines: string[],
): { level?: JobSeniorityLevel; years?: string; sourceText: string }[] {
  const out: { level?: JobSeniorityLevel; years?: string; sourceText: string }[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const t = stripBulletMarker(line);
    if (!t) continue;
    let level: JobSeniorityLevel | undefined;
    for (const [label, re] of SENIORITY_LEVEL_RE) {
      if (re.test(t)) {
        level = label;
        break;
      }
    }
    const yearsMatch = t.match(YEARS_RE);
    const years = yearsMatch ? `${yearsMatch[1]}+` : undefined;
    if (!level && !years) continue;
    const key = `${level ?? "level"}|${years ?? "years"}|${t}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ level, years, sourceText: t });
  }
  return out;
}

/* ── Domain ──────────────────────────────────────────────────────────────── */

const DOMAIN_LEXICON: { term: string; label: string }[] = [
  { term: "fintech|financial services|banking", label: "FinTech" },
  { term: "healthcare|health care|medical|healthtech", label: "Healthcare" },
  { term: "e-commerce|ecommerce|retail", label: "E-Commerce" },
  { term: "saas|software as a service", label: "SaaS" },
  { term: "ai|machine learning|ml|data science|artificial intelligence", label: "AI / ML" },
  { term: "cybersecurity|security", label: "Cybersecurity" },
  { term: "gaming|games", label: "Gaming" },
  { term: "edtech|education technology", label: "EdTech" },
  { term: "logistics|supply chain", label: "Logistics" },
  { term: "travel|hospitality", label: "Travel & Hospitality" },
  { term: "media|streaming|entertainment", label: "Media" },
  { term: "automotive", label: "Automotive" },
  { term: "real estate|proptech", label: "Real Estate" },
  { term: "advertising|marketing|adtech", label: "Marketing / AdTech" },
];

/** Extract domain/industry terms present in the JD (lexicon-based, literal). */
export function extractDomain(
  lines: string[],
): { name: string; sourceText: string }[] {
  const out: { name: string; sourceText: string }[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const t = stripBulletMarker(line);
    if (!t) continue;
    for (const { term, label } of DOMAIN_LEXICON) {
      if (new RegExp(`\\b(${term})\\b`, "i").test(t)) {
        if (seen.has(label)) continue;
        seen.add(label);
        out.push({ name: label, sourceText: t });
      }
    }
  }
  return out;
}

/* ── Implicit competencies ───────────────────────────────────────────────── */

const COMPETENCY_LEXICON: { name: string; re: RegExp }[] = [
  { name: "Collaboration", re: /\bcross-functional\b|\bwork(ing)? (closely )?with\b|\bstakeholders?\b|\bteam player\b/i },
  { name: "Leadership", re: /\bmentor(ing)?\b|\bcoach(ing)?\b|\blead(ing|ership)?\b|\bguide\b/i },
  { name: "Time Management", re: /\bdeadlines?\b|\bfast-paced\b|\bprioriti[sz]e\b|\btime management\b/i },
  { name: "Ownership", re: /\bownership\b|\bself-?directed\b|\bindependent(ly)?\b|\btake (full )?responsibility\b/i },
  { name: "Communication", re: /\bcommunicat(e|ion|ing)\b|\bpresent(ing)?\b|\bdocument(ing|ation)?\b|\bstory?telling\b/i },
  { name: "Problem Solving", re: /\bproblem[ -]?solv(ing|e)\b|\btroubleshoot(ing)?\b|\banalytical\b|\bambigu(ous|ity)\b/i },
  { name: "Analytical Thinking", re: /\bdata-?driven\b|\bmetrics\b|\banalytics\b|\bquantitative\b/i },
  { name: "Customer Focus", re: /\bcustomer[- ]?(centric|focused|facing|first)\b|\bclient[- ]?facing\b/i },
  { name: "Adaptability", re: /\badapt(able|ability)?\b|\bflexib(le|ility)\b|\bchanging (priorities|environment)\b/i },
  { name: "Attention to Detail", re: /\battention to detail\b|\bdetail-?oriented\b/i },
];

/**
 * Derive implicit competencies from context phrases. This is the only
 * derivation step in M2: it maps a literal phrase to a canonical competency
 * name. It never invents candidate facts — it only interprets the JD.
 */
export function extractImplicitCompetencies(
  lines: string[],
): { name: string; context: string }[] {
  const out: { name: string; context: string }[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const t = stripBulletMarker(line);
    if (!t) continue;
    for (const { name, re } of COMPETENCY_LEXICON) {
      if (re.test(t)) {
        const key = `${name}|${t}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name, context: t });
      }
    }
  }
  return out;
}
