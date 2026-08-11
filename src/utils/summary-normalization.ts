"use strict";

/**
 * Deterministic SUMMARY normalization (PATORBIT CORE RULE — NO AI).
 *
 * The parser (rawToResume) and the AI resolver can both leave contact/link
 * tokens inside the summary prose ("AI/ML Engineer and Data Engineer
 * linkedin.com/in/example github.com/example"). This module removes ONLY the
 * tokens that are independently and deterministically classified as:
 *
 *   email   (EMAIL_RE — the same classifier evidence.ts uses for contact facts)
 *   phone   (PHONE_RE — same as evidence.ts)
 *   link    (URL_RE   — same as evidence.ts; classified to linkedin / github /
 *                       website exactly like the mapper's link classifier)
 *
 * Everything else is preserved verbatim — a word that merely resembles a
 * skill, company, role, date or technology is NEVER removed, and the summary
 * is never rewritten, reworded or "improved". When nothing is classified the
 * input text is returned unchanged. Identical input always yields identical
 * output.
 *
 * The original summary (including the classified tokens) is preserved with
 * full provenance in the API response's `evidence` array (summary-block `other`
 * facts), so rule "preserve provenance/evidence for the original summary and
 * extracted tokens where the current types support it" is satisfied there.
 */

import { EMAIL_RE, PHONE_RE, URL_RE } from "@/lib/document-model/evidence";

export type SummarySocialKey = "linkedin" | "github" | "website";

export interface SummaryToken {
  type: "email" | "phone" | "link";
  value: string;
  social?: SummarySocialKey;
}

export interface SummaryNormalizationResult {
  /** Summary with ONLY classified tokens removed; prose untouched otherwise. */
  summary: string;
  /** Classified tokens in source order (deduplicated). */
  tokens: SummaryToken[];
}

/** Which social field a bare/parked URL belongs to. Must mirror the mapper. */
export function classifyLink(value: string): SummarySocialKey | null {
  const v = value.toLowerCase();
  if (v.includes("linkedin.com")) return "linkedin";
  if (v.includes("github.com")) return "github";
  return "website";
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface Span {
  start: number;
  end: number;
  value: string;
}

/**
 * Deterministically classify the email/phone/link tokens inside a summary and
 * remove exactly those tokens. URL matches win: an email or phone match that
 * falls inside a URL span is ignored (never a phantom phone inside a URL).
 */
export function normalizeSummaryTokens(text: string): SummaryNormalizationResult {
  if (!text) return { summary: text, tokens: [] };

  const tokens: SummaryToken[] = [];
  const seen = new Set<string>();

  const add = (type: SummaryToken["type"], value: string, social?: SummarySocialKey) => {
    const key = `${type}\u0000${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    tokens.push(social ? { type, value, social } : { type, value });
  };

  const urlRe = new RegExp(URL_RE.source, "gi");
  const emailRe = new RegExp(EMAIL_RE.source, "g");
  const phoneRe = new RegExp(PHONE_RE.source, "g");

  const urlSpans: Span[] = [];
  for (const m of text.matchAll(urlRe)) {
    const raw = m[0].replace(/[.,;:!?)]+$/, "");
    const social = classifyLink(raw);
    if (!social || !raw) continue;
    urlSpans.push({ start: m.index, end: m.index + m[0].length, value: raw });
    add("link", raw, social);
  }

  const insideUrl = (index: number): boolean =>
    urlSpans.some((s) => index >= s.start && index < s.end);

  for (const m of text.matchAll(emailRe)) {
    if (insideUrl(m.index)) continue;
    add("email", m[0]);
  }

  for (const m of text.matchAll(phoneRe)) {
    if (insideUrl(m.index)) continue;
    add("phone", m[0]);
  }

  if (tokens.length === 0) return { summary: text, tokens };

  let cleaned = text;
  for (const token of tokens) {
    cleaned = cleaned.replace(new RegExp(escapeRegExp(token.value), "g"), " ");
  }
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  // The removal can leave a separator artifact behind ("email | phone" →
  // " | " after token removal) — a lone pipe is not user prose, strip it.
  cleaned = cleaned.replace(/\s*\|\s*/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  // The removal can leave a space right before sentence punctuation ("at .");
  // that whitespace is an artifact of the removal, not user prose — fold it.
  cleaned = cleaned.replace(/\s+([.,;:!?)+])/g, "$1").trim();

  return { summary: cleaned, tokens };
}