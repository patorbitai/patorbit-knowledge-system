"use client";

import type { Resume, Claim, Evidence } from "@/types/resume";
import { useResumeBuilder } from "@/store/resume-builder";
import { User, MapPin, Briefcase, ShieldCheck, Eye } from "lucide-react";
import { clsx } from "clsx";

/**
 * Helper: format an ISO date string or "YYYY-MM" into a readable label
 * like "Jan 2020". Returns "—" for empty input.
 */
function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Derive a meaningful career focus from the professional's real data.
 *
 * Preference order (most meaningful wins):
 *   1. Current role's industry (e.g. "Fintech")
 *   2. Most common industry across experience
 *   3. Most common skill category (e.g. "Frontend")
 *
 * Returns null when nothing meaningful can be derived — the caller then
 * omits the field rather than guessing.
 */
function deriveCareerFocus(resume: Resume): string | null {
  const exp = resume.experience ?? [];
  const industries = exp.map((e) => e.industry?.trim()).filter((v): v is string => !!v);
  const roles = exp
    .map((e) => e.position?.trim())
    .filter((v): v is string => !!v && v.length > 0);

  // 1) Current role's industry, falling back to most frequent industry.
  const current = exp.find((e) => e.current);
  if (current?.industry?.trim()) return current.industry.trim();
  if (industries.length > 0) {
    const counts = new Map<string, number>();
    for (const i of industries) counts.set(i, (counts.get(i) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  // 2) Most common skill category (e.g. "Programming Languages").
  const categories = (resume.skills ?? []).map((s) => s.category?.trim()).filter((v): v is string => !!v);
  if (categories.length > 0) {
    const counts = new Map<string, number>();
    for (const c of categories) counts.set(c, (counts.get(c) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  return null;
}

/**
 * Phase 1: Professional Identity Header
 *
 * Renders the candidate's core identity: who they are, what they do,
 * and a brief summary — plus an honest subtitle explaining the source
 * of the profile.
 */
function IdentityHeader({ resume }: { resume: Resume }) {
  const hasLocation = resume.address;
  const hasTitle = resume.title;
  const hasSummary = resume.summary && resume.summary.trim().length > 0;

  return (
    <div className="border-b border-white/[0.06] pb-6">
      <div className="flex items-center gap-4">
        {/* Placeholder for future avatar */}
        <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center">
          <User className="w-8 h-8 text-slate-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">{resume.name || "Untitled Profile"}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
            {hasTitle && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{resume.title}</span>
              </div>
            )}
            {hasTitle && hasLocation && <span className="text-slate-600">•</span>}
            {hasLocation && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{resume.address}</span>
              </div>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Professional profile generated from the professional information you supported.
          </p>
        </div>
      </div>
      {hasSummary && (
        <p className="mt-4 text-sm text-slate-300/80 leading-relaxed max-w-2xl">
          {resume.summary}
        </p>
      )}
    </div>
  );
}

/**
 * Derive total experience in years from the experience list.
 * Uses the earliest start date to the latest end date (or now if current).
 */
function deriveExperienceYears(exp: Resume["experience"]): number | null {
  if (exp.length === 0) return null;
  const starts = exp.map((e) => e.startDate ? new Date(e.startDate).getTime() : null).filter((v): v is number => v !== null);
  if (starts.length === 0) return null;
  const earliest = Math.min(...starts);
  const ends = exp
    .map((e) => (e.current || !e.endDate ? Date.now() : new Date(e.endDate).getTime()))
    .filter((v): v is number => !Number.isNaN(v));
  const latest = ends.length > 0 ? Math.max(...ends) : Date.now();
  const years = (latest - earliest) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.round(years * 10) / 10);
}

/**
 * Phase 1: Career Snapshot
 *
 * A concise summary of the professional's current state: current role,
 * company, derived total experience, and a meaningful career focus.
 */
function CareerSnapshot({ resume }: { resume: Resume }) {
  const exp = resume.experience ?? [];
  const currentRole = exp.find((e) => e.current) ?? exp[0];
  const totalYears = deriveExperienceYears(exp);
  const careerFocus = deriveCareerFocus(resume);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
        Career Snapshot
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Current Role</div>
          {currentRole ? (
            <>
              <div className="mt-1 text-sm font-medium text-white">{currentRole.position || "Untitled role"}</div>
              <div className="text-xs text-slate-400">{currentRole.company || "—"}</div>
            </>
          ) : (
            <div className="mt-1 text-xs text-slate-500 italic">No role added yet</div>
          )}
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Experience</div>
          <div className="mt-1 text-sm font-medium text-white">
            {totalYears !== null ? `${totalYears} yr${totalYears === 1 ? "" : "s"}` : "—"}
          </div>
        </div>
        {careerFocus && (
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Career Focus</div>
            <div className="mt-1 text-sm text-white">{careerFocus}</div>
          </div>
        )}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Education</div>
          {resume.education && resume.education.length > 0 ? (
            <div className="mt-1 text-sm text-white">
              {resume.education[0].degree || "Degree"} · {resume.education[0].school || "School"}
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-500 italic">No education added</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Plain-language summary of a single claim's support state.
 * Converts raw counts into a meaningful, honest sentence.
 */
/**
 * Phase 1: Trust Snapshot
 *
 * The signature section of the Passport. Communicates the professional's
 * overall trust state in plain language — not just metrics.
 *
 * IMPORTANT (Beta): We never claim external verification. Language is
 * "Supported" / "supported by evidence" — never "Verified".
 */
function TrustSnapshot({
  claims,
  evidence,
}: {
  claims: Claim[];
  evidence: Evidence[];
}) {
  const claimIdsWithEvidence = new Set(evidence.map((e) => e.claimId));
  const supportedClaims = claims.filter((c) => claimIdsWithEvidence.has(c.id));

  const lastUpdated = evidence.reduce((latest, e) => {
    const t = e.updatedAt ? new Date(e.updatedAt).getTime() : 0;
    return t > latest ? t : latest;
  }, 0);

  // Insight-driven headline derived from the actual numbers.
  let insight: string;
  if (claims.length === 0) {
    insight = "No claims yet. Accept claims you believe in to start building a supported profile.";
  } else if (supportedClaims.length === 0) {
    insight = "Claims are identified but not yet supported by evidence.";
  } else if (supportedClaims.length === claims.length) {
    insight = "Every claim is backed by at least one piece of evidence.";
  } else {
    insight = `${supportedClaims.length} of ${claims.length} claims are backed by evidence.`;
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
        Professional Trust
      </h2>
      <p className="text-sm text-slate-300 mb-4">{insight}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Supported Claims</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-400">{supportedClaims.length}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Evidence Items</div>
          <div className="mt-1 text-2xl font-semibold text-white">{evidence.length}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Evidence Coverage</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {claims.length > 0 ? Math.round((supportedClaims.length / claims.length) * 100) : 0}%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Last Updated</div>
          <div className="mt-1 text-xs text-slate-400">
            {lastUpdated > 0 ? formatDate(new Date(lastUpdated).toISOString()) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Phase 2: Professional Highlights
 *
 * The top 5 supported claims, each with its support status, an honest
 * evidence summary, and a way to view the evidence. Kept intentionally
 * brief so it doesn't overload the page.
 */
function ProfessionalHighlights({ claims, evidence }: { claims: Claim[]; evidence: Evidence[] }) {
  const claimIdsWithEvidence = new Set(evidence.map((e) => e.claimId));

  // Only supported claims are "highlights"; keep to the strongest 5.
  const supported = claims
    .filter((c) => claimIdsWithEvidence.has(c.id))
    .slice(0, 5);

  // Determine display of the evidence for a claim — always honest.
  const evidenceFor = (claimId: string) => evidence.filter((e) => e.claimId === claimId);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
        Professional Highlights
      </h2>

      {supported.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          No supported claims yet. Accept claims and attach evidence to see them here.
        </p>
      ) : (
        <div className="space-y-3">
          {supported.map((claim) => {
            const claimEvidence = evidenceFor(claim.id);
            const summary = claimEvidence
              .map((e) => e.metadata.linkTitle || e.metadata.fileName || e.evidenceKind)
              .filter(Boolean)
              .slice(0, 2)
              .join(", ");
            return (
              <div
                key={claim.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-200 font-medium">{claim.assertionText}</p>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    Supported
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500 break-words min-w-0">
                    {summary || `Supported by ${claimEvidence.length} evidence ${claimEvidence.length === 1 ? "item" : "items"}.`}
                  </p>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    <Eye className="w-3 h-3" />
                    View Evidence
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Phase 1 + 2: Main Passport Component
 *
 * Professional Identity surface. Hierarchy:
 *   Identity → Career Snapshot → Trust Snapshot → Professional Highlights
 *
 * Designed for a 30-second recruiter scan: who they are, what they do,
 * why they should be trusted, and the story their top claims tell.
 */
export function Passport() {
  const resume = useResumeBuilder((s) => s.resume);
  const claims = useResumeBuilder((s) => s.resume.claims);
  const evidence = useResumeBuilder((s) => s.evidence);

  return (
    <div className="space-y-6">
      <IdentityHeader resume={resume} />
      <CareerSnapshot resume={resume} />
      <TrustSnapshot claims={claims} evidence={evidence} />
      <ProfessionalHighlights claims={claims} evidence={evidence} />
    </div>
  );
}