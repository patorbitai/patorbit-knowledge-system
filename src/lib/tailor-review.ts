"use strict";

/**
 * Tailor review (§10–§17).
 *
 * Turns a raw AI tailoring result into a list of reviewable suggestions —
 * each with the change, the job-driven reason, the user's own evidence, a
 * confidence level, and a safe/blocked verdict — then applies only the
 * user's decisions back onto the ORIGINAL resume.
 *
 * Hard guarantees (§12 — never fabricate):
 *  - The master/original resume is the base for every apply; the AI payload
 *    can only ever modify sections the user approved here.
 *  - Anything the AI added that is not backed by the original profile
 *    (new skills, new employers, new tech tokens, extra experience entries)
 *    is listed in `blocked` and can never reach the applied resume — even if
 *    the user accepts the suggestion around it.
 *  - An edited decision is user-provided text: the user is the source of
 *    truth, so their wording is applied verbatim (provenance: user-input).
 */

import type { Experience, Resume, Skill } from "@/types/resume";
import type { CareerProfile } from "@/types/career-profile";
import type { JobProfile } from "@/types/job-profile";
import type { QualificationMatch } from "@/types/qualification-match";
import { extractTechTokens } from "@/lib/job-profile/extract";
import { resolveEvidenceLabel } from "@/lib/provenance";

/* ── Types ─────────────────────────────────────────────────────────────── */

export type SuggestionKind = "rewrite" | "reorder" | "omit";
export type SuggestionConfidence = "high" | "medium" | "low";

export interface SuggestionEvidence {
  /** Verifiable origin: "Software Engineer — Acme — 2024 – 2026". */
  label: string;
  /** Verbatim user quote (their own resume text). */
  quote: string;
}

export interface TailorSuggestion {
  /** Stable id: "summary" | "skills" | "exp:<index>". */
  id: string;
  kind: SuggestionKind;
  sectionLabel: string;
  /** What the user currently has. */
  original: string;
  /** What Patorbit recommends. */
  suggested: string;
  /** Why the change is relevant to the job (§11). */
  why: string;
  /** Where the information came from — user data only (§11). */
  evidence: SuggestionEvidence[];
  confidence: SuggestionConfidence;
  /** True when every part of the change traces to the user's own data (§15). */
  safe: boolean;
  /** Fragments that must NEVER be applied regardless of Accept (§12). */
  blocked: string[];
}

export type SuggestionStatus = "accepted" | "rejected" | "edited";
export interface SuggestionDecision {
  status: SuggestionStatus;
  /** User's own wording when status === "edited". */
  text?: string;
}
export type SuggestionDecisions = Record<string, SuggestionDecision>;

export interface ApplyResult {
  /** Original resume + only the approved changes. Master stays untouched. */
  resume: Resume;
  accepted: number;
  edited: number;
  rejected: number;
  pending: number;
  /** Number of blocked fragments stripped/withheld during apply. */
  blocked: number;
}

export interface BuildSuggestionsInput {
  original: Resume;
  /** The AI's tailored payload (untrusted — never applied wholesale). */
  tailored: Resume;
  match: QualificationMatch | null;
  profile: CareerProfile | null;
  jobProfile: JobProfile | null;
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

const norm = (s: string): string => (s ?? "").trim().toLowerCase();

function list(items: string[]): string {
  const shown = items.slice(0, 4);
  const s = shown.join(", ");
  return items.length > shown.length ? `${s} and ${items.length - shown.length} more` : s;
}

/** All tech tokens the original resume can substantiate. */
export function resumeTechTokens(r: Resume): Set<string> {
  const parts: string[] = [r.summary ?? ""];
  for (const s of r.skills ?? []) parts.push(s.name ?? "");
  for (const e of r.experience ?? []) {
    parts.push(e.description ?? "", e.achievements ?? "", e.techUsed ?? "", ...(e.bulletPoints ?? []));
  }
  for (const p of r.projects ?? []) parts.push(p.description ?? "", p.tech ?? "", ...(p.bulletPoints ?? []));
  for (const c of r.certifications ?? []) parts.push(c.name ?? "", c.description ?? "");
  const out = new Set<string>();
  for (const tok of extractTechTokens(parts.join("\n"))) out.add(norm(tok));
  return out;
}

/**
 * Does the original profile already cover this tech token?
 * Prefix matching softens near-misses ("React" ⊆ "ReactJS") so we never
 * block a legitimate rewrite over a naming variant.
 */
export function techCovered(orig: Set<string>, token: string): boolean {
  const t = norm(token);
  if (orig.has(t)) return true;
  for (const o of orig) {
    if (t.length >= 4 && o.length >= 4 && (o.startsWith(t) || t.startsWith(o))) return true;
  }
  return false;
}

/** Focus skills from the JD that actually appear in the given text (§10). */
function jdFocusTerms(text: string, jobProfile: JobProfile | null): string[] {
  if (!jobProfile) return [];
  const lower = norm(text);
  const out: string[] = [];
  for (const s of jobProfile.skills) {
    const name = (s.name ?? "").trim();
    if (name.length < 2) continue;
    if (lower.includes(norm(name))) out.push(name);
  }
  return [...new Set(out)].slice(0, 6);
}

/** Evidence rows for focus terms, resolved through the deterministic match. */
function evidenceForTerms(
  terms: string[],
  match: QualificationMatch | null,
  profile: CareerProfile | null,
): SuggestionEvidence[] {
  const rows: SuggestionEvidence[] = [];
  const seen = new Set<string>();
  if (!match) return rows;
  for (const term of terms) {
    const t = norm(term);
    for (const item of match.items) {
      if (!norm(item.requirement).includes(t)) continue;
      for (const ev of item.evidence) {
        const label = resolveEvidenceLabel(ev, profile);
        const quote = (ev.text ?? "").trim();
        const key = `${label}|${quote}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ label, quote: quote ? `“${quote}”` : "" });
      }
    }
  }
  return rows.slice(0, 4);
}

/** Evidence for an experience rewrite = the entry's own user-written text. */
function experienceEvidence(e: Experience): SuggestionEvidence[] {
  const quote = (e.bulletPoints?.[0] ?? e.description ?? "").trim();
  const end = e.current ? "Present" : e.endDate;
  const dates = [e.startDate, end].filter(Boolean).join(" – ");
  const label = [e.position, e.company, dates].filter(Boolean).join(" — ");
  return [{ label, quote: quote ? `“${quote.slice(0, 180)}”` : "" }];
}

function experienceLabel(e: Experience): string {
  return `Experience — ${[e.position, e.company].filter(Boolean).join(", ")}`;
}

function splitList(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function makeSkill(name: string): Skill {
  return {
    id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    level: "Intermediate",
    category: "",
    years: "",
  };
}

/* ── Fabrication guard (§12) ───────────────────────────────────────────── */

/**
 * Every fragment of the AI payload that is NOT backed by the original
 * profile. These strings are surfaced to the user and stripped on apply —
 * they can never reach an exported resume, even when accepted.
 */
export function detectUnsupportedAdditions(original: Resume, tailored: Resume): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };

  const origSkills = new Set((original.skills ?? []).map((s) => norm(s.name)));
  for (const s of tailored.skills ?? []) {
    if (!origSkills.has(norm(s.name))) push(`Skill: ${s.name}`);
  }

  const origTech = resumeTechTokens(original);

  const origCompanies = new Set((original.experience ?? []).map((e) => norm(e.company)));
  const origExpCount = (original.experience ?? []).length;
  (tailored.experience ?? []).forEach((e, i) => {
    if (e.company && !origCompanies.has(norm(e.company))) push(`Employer: ${e.company}`);
    // Extra entries beyond the original list = invented jobs (§12/§13).
    if (i >= origExpCount) push(`Employer: ${e.company || e.position || `entry #${i + 1}`}`);
  });

  const origCerts = new Set((original.certifications ?? []).map((c) => norm(c.name)));
  for (const c of tailored.certifications ?? []) {
    if (!origCerts.has(norm(c.name))) push(`Certification: ${c.name}`);
  }

  const origDegrees = new Set(
    (original.education ?? []).map((e) => `${norm(e.degree)}|${norm(e.school)}`),
  );
  for (const e of tailored.education ?? []) {
    if (!origDegrees.has(`${norm(e.degree)}|${norm(e.school)}`)) {
      push(`Education: ${[e.degree, e.school].filter(Boolean).join(", ")}`);
    }
  }

  const allText = [
    tailored.summary ?? "",
    ...(tailored.skills ?? []).map((s) => s.name ?? ""),
    ...(tailored.experience ?? []).flatMap((e) => [
      e.description ?? "",
      ...(e.bulletPoints ?? []),
    ]),
  ].join("\n");
  for (const tok of extractTechTokens(allText)) {
    if (!techCovered(origTech, tok)) push(`Technology not in your profile: ${tok}`);
  }

  return out;
}

/* ── Suggestion builder (§10/§11) ──────────────────────────────────────── */

export function buildSuggestions(input: BuildSuggestionsInput): TailorSuggestion[] {
  const { original, tailored, match, profile, jobProfile } = input;
  const out: TailorSuggestion[] = [];
  const origTech = resumeTechTokens(original);

  /* Professional summary */
  if (norm(tailored.summary) !== norm(original.summary) && tailored.summary) {
    const terms = jdFocusTerms(tailored.summary, jobProfile);
    const evidence = evidenceForTerms(terms, match, profile);
    const blocked = extractTechTokens(tailored.summary)
      .filter((t) => !techCovered(origTech, t))
      .map((t) => `Technology not in your profile: ${t}`);
    out.push({
      id: "summary",
      kind: "rewrite",
      sectionLabel: "Professional summary",
      original: original.summary ?? "",
      suggested: tailored.summary,
      why: terms.length
        ? `The job description emphasizes ${list(terms)}.`
        : "Rewritten to mirror the wording of the target job description.",
      evidence,
      confidence: blocked.length ? "low" : evidence.length ? "high" : "medium",
      safe: blocked.length === 0 && evidence.length > 0,
      blocked,
    });
  }

  /* Skills */
  const origNames = (original.skills ?? []).map((s) => s.name);
  const newNames = (tailored.skills ?? []).map((s) => s.name);
  const origSet = new Set(origNames.map(norm));
  const newSet = new Set(newNames.map(norm));
  const sameSet =
    origSet.size === newSet.size && [...origSet].every((n) => newSet.has(n));
  if (!sameSet) {
    const added = newNames.filter((n) => !origSet.has(norm(n)));
    const removed = origNames.filter((n) => !newSet.has(norm(n)));
    const blocked = added.map((n) => `Skill: ${n}`);
    const kind: SuggestionKind = added.length === 0 && removed.length === 0 ? "reorder" : "rewrite";
    const terms = jdFocusTerms(newNames.join(", "), jobProfile);
    const evidence = evidenceForTerms(terms, match, profile);
    out.push({
      id: "skills",
      kind,
      sectionLabel: "Skills",
      original: origNames.join(", "),
      suggested: newNames.join(", "),
      why:
        kind === "reorder"
          ? `Reordered so the skills the job asks for come first${terms.length ? ` — ${list(terms)}` : ""}.`
          : `Skills refocused on the job's stack${terms.length ? ` — ${list(terms)}` : ""}${
              removed.length ? `; drops ${list(removed)}` : ""
            }.`,
      evidence,
      confidence: blocked.length ? "low" : evidence.length ? "high" : "medium",
      safe: blocked.length === 0 && (kind === "reorder" || evidence.length > 0),
      blocked,
    });
  }

  /* Experience — aligned by index against the original entries */
  const tailExps = tailored.experience ?? [];
  (original.experience ?? []).forEach((oe, idx) => {
    const te = tailExps[idx];
    if (!te) {
      out.push({
        id: `exp:${idx}`,
        kind: "omit",
        sectionLabel: experienceLabel(oe),
        original: [oe.position, oe.company].filter(Boolean).join(" — "),
        suggested: "(Omitted from this version)",
        why: "This entry is dropped in the tailored version to keep the resume focused on the target role.",
        evidence: experienceEvidence(oe),
        confidence: "high",
        safe: true,
        blocked: [],
      });
      return;
    }

    const origText = (oe.bulletPoints ?? []).length
      ? (oe.bulletPoints ?? []).join("\n")
      : oe.description ?? "";
    const newText = (te.bulletPoints ?? []).length
      ? (te.bulletPoints ?? []).join("\n")
      : te.description ?? "";
    const companyChanged = !!te.company && norm(te.company) !== norm(oe.company);
    if (!companyChanged && norm(newText) === norm(origText)) return;

    const blocked: string[] = [];
    if (companyChanged) blocked.push(`Employer: ${te.company}`);
    for (const tok of extractTechTokens(newText)) {
      if (!techCovered(origTech, tok)) blocked.push(`Technology not in your profile: ${tok}`);
    }

    const terms = jdFocusTerms(newText, jobProfile);
    let evidence = evidenceForTerms(terms, match, profile);
    if (evidence.length === 0) evidence = experienceEvidence(oe);

    out.push({
      id: `exp:${idx}`,
      kind: "rewrite",
      sectionLabel: experienceLabel(oe),
      original: origText,
      suggested: newText,
      why: terms.length
        ? `The job description emphasizes ${list(terms)}.`
        : "Refocused this entry on the work the target role asks for.",
      evidence: evidence.slice(0, 3),
      confidence: blocked.length ? "low" : "high",
      safe: blocked.length === 0,
      blocked,
    });
  });

  return out;
}

/* ── Decisions (§15/§16) ───────────────────────────────────────────────── */

/** Accept every suggestion that is safe-by-construction; never overrides a decision. */
export function acceptAllSafe(
  suggestions: TailorSuggestion[],
  existing: SuggestionDecisions = {},
): SuggestionDecisions {
  return acceptAllSafeWithCount(suggestions, existing).decisions;
}

export interface AcceptAllResult {
  decisions: SuggestionDecisions;
  /**
   * Suggestions newly marked accepted by this batch — drives the
   * `suggestion_accepted { section: "accept-all-safe" }` analytics event so
   * batch acceptance is counted exactly once (§24).
   */
  acceptedCount: number;
}

/** Accept-all with an explicit count of what changed (analytics, §1.2). */
export function acceptAllSafeWithCount(
  suggestions: TailorSuggestion[],
  existing: SuggestionDecisions = {},
): AcceptAllResult {
  const decisions: SuggestionDecisions = { ...existing };
  let acceptedCount = 0;
  for (const s of suggestions) {
    if (decisions[s.id]) continue;
    if (s.safe) {
      decisions[s.id] = { status: "accepted" };
      acceptedCount++;
    }
  }
  return { decisions, acceptedCount };
}

/** The §24 analytics event for a decision status. */
export function suggestionEventFor(
  status: SuggestionStatus,
): "suggestion_accepted" | "suggestion_rejected" | "suggestion_edited" {
  if (status === "accepted") return "suggestion_accepted";
  if (status === "rejected") return "suggestion_rejected";
  return "suggestion_edited";
}

export function countDecisions(
  suggestions: TailorSuggestion[],
  decisions: SuggestionDecisions,
): { accepted: number; edited: number; rejected: number; pending: number } {
  let accepted = 0;
  let edited = 0;
  let rejected = 0;
  let pending = 0;
  for (const s of suggestions) {
    const st = decisions[s.id]?.status;
    if (st === "accepted") accepted++;
    else if (st === "edited") edited++;
    else if (st === "rejected") rejected++;
    else pending++;
  }
  return { accepted, edited, rejected, pending };
}

/* ── Guarded apply (§12/§13/§15/§17) ───────────────────────────────────── */

/**
 * Apply the user's decisions onto a fresh copy of the ORIGINAL resume.
 * The AI payload only ever supplies wording for sections that were
 * explicitly accepted/edited — and even then, blocked fragments are
 * stripped. Anything not decided stays exactly as the user has it.
 */
export function applyTailorSuggestions(
  original: Resume,
  tailored: Resume,
  suggestions: TailorSuggestion[],
  decisions: SuggestionDecisions,
): ApplyResult {
  const resume: Resume = structuredClone(original);
  const counts = countDecisions(suggestions, decisions);
  let blocked = 0;

  const origTech = resumeTechTokens(original);
  const removeExps = new Set<number>();

  for (const sug of suggestions) {
    const dec = decisions[sug.id];
    const status = dec?.status;
    if (!status) continue; // pending → untouched
    if (status === "rejected") continue; // rejected → untouched

    // User text wins whenever it is present — whether the decision is
    // "edited" or "edit-then-accepted". Without this, Accept after an edit
    // silently reverted to the AI's wording (live acceptance finding).
    const isEdited = (dec.text ?? "").trim().length > 0;
    const text = isEdited ? (dec.text as string).trim() : sug.suggested;

    if (sug.id === "summary") {
      if (status === "accepted" && !isEdited && sug.blocked.length > 0) {
        // AI summary carries unsupported tech — withheld entirely (§12).
        // Only the AI's wording is withheld: an edited summary is the
        // user's own text (user-provided provenance) and is applied as-is.
        blocked += sug.blocked.length;
        continue;
      }
      resume.summary = text;
      continue;
    }

    if (sug.id === "skills") {
      const byNorm = new Map((original.skills ?? []).map((s) => [norm(s.name), s]));
      const names = splitList(text);
      if (isEdited) {
        // User's own list = user-provided truth.
        resume.skills = names.map((n) => byNorm.get(norm(n)) ?? makeSkill(n));
      } else {
        const kept = names.filter((n) => {
          if (sug.blocked.includes(`Skill: ${n}`)) {
            blocked++;
            return false;
          }
          return true;
        });
        resume.skills = kept.map((n) => byNorm.get(norm(n)) ?? makeSkill(n));
      }
      continue;
    }

    if (sug.kind === "omit" && sug.id.startsWith("exp:")) {
      removeExps.add(Number(sug.id.slice(4)));
      continue;
    }

    if (sug.kind === "rewrite" && sug.id.startsWith("exp:")) {
      const idx = Number(sug.id.slice(4));
      const oe = original.experience?.[idx];
      const te = resume.experience?.[idx];
      if (!te || !oe) continue;

      // Employer identity can never change (§13 — master is source of truth).
      // The apply base is already the original, so the AI's company swap is
      // withheld by construction — count it so the user sees it was blocked.
      if (sug.blocked.some((b) => b.startsWith("Employer:"))) {
        blocked++;
        te.company = oe.company;
      }

      if (isEdited) {
        // User wording wins verbatim (user-provided provenance).
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        if ((te.bulletPoints ?? []).length > 0 || (oe.bulletPoints ?? []).length > 0) {
          te.bulletPoints = lines;
        } else {
          te.description = lines.join("\n");
        }
        continue;
      }

      // Accepted AI wording: strip any line carrying unsupported tech (§12).
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const kept: string[] = [];
      for (const line of lines) {
        const bad = extractTechTokens(line).some((t) => !techCovered(origTech, t));
        if (bad) {
          blocked++;
          continue;
        }
        kept.push(line);
      }
      if (kept.length > 0) {
        if ((oe.bulletPoints ?? []).length > 0) te.bulletPoints = kept;
        else te.description = kept.join("\n");
      }
      continue;
    }
  }

  // Extra experience entries the AI invented can never be applied (§12).
  const extra = (tailored.experience ?? []).length - (original.experience ?? []).length;
  if (extra > 0) blocked += extra;

  if (removeExps.size > 0) {
    resume.experience = (resume.experience ?? []).filter((_, i) => !removeExps.has(i));
  }

  return {
    resume,
    accepted: counts.accepted,
    edited: counts.edited,
    rejected: counts.rejected,
    pending: counts.pending,
    blocked,
  };
}
