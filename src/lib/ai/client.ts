"use client";

/**
 * AI Service Client
 *
 * Thin wrapper around the single `/api/ai` endpoint used by the frontend.
 * Keeps request/response handling in one place so UI components stay clean.
 *
 * Usage:
 *   import { ai } from "@/lib/ai/client";
 *   const { content } = await ai.generateSummary(resume);
 */
import type { Resume, Experience, Project, ResumeAnalysis, SuggestedClaim } from "@/types/resume";
import type { EvidenceOptimizerResult } from "@/types/evidence-optimizer";
import type { CareerProfile } from "@/types/career-profile";
import type { JobProfile } from "@/types/job-profile";
import type { QualificationMatch } from "@/types/qualification-match";
import { track } from "@/lib/analytics";

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export class AIClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "UPSTREAM", status = 500) {
    super(message);
    this.name = "AIClientError";
    this.code = code;
    this.status = status;
  }
}

/* ── M6 — centralized AI failure classification + telemetry ───────────────── */

/**
 * How an AI request failed, from the user's / product's point of view:
 *   quota — monthly usage quota exhausted (429 + USAGE_LIMIT_REACHED)
 *   rate  — rate limited (429 without the quota code), retryable after Retry-After
 *   error — everything else (network, upstream, timeout, 5xx, …)
 */
export type AIFailureKind = "quota" | "rate" | "error";

export interface AIFailureInfo {
  /** API route that failed, e.g. "/api/ai" or "/api/ai/score". */
  route: string;
  /** Optional /api/ai action name (never contains resume data). */
  action?: string;
  status: number;
  code?: string;
  retryAfter?: number;
  /** Optional server-provided error message (shown in the quota gate). */
  detail?: string;
}

/**
 * Classify one failed AI response and emit EXACTLY ONE telemetry event for it:
 *   quota → "ai_quota_exceeded" (takes precedence over a generic 429),
 *   rate  → "ai_rate_limited",
 *   error → nothing (ordinary AI error handling, already covered elsewhere).
 *
 * Props carry only route/action/status-class facts — no resume data, no user
 * ids, no PII (sanitizeProps strips anything suspicious on the way out too).
 *
 * This is the single classification point: callAI uses it, and direct-fetch
 * callers (useOptimization, TailorResumeModal, AIWorkspaceClient) call it with
 * their parsed failure so every failed response is classified exactly once.
 */
export function classifyAiFailure(info: AIFailureInfo): AIFailureKind {
  // Quota first: a quota 429 carries code USAGE_LIMIT_REACHED and must not be
  // reported as a transient rate limit.
  if (info.code === "USAGE_LIMIT_REACHED") {
    track("ai_quota_exceeded", {
      route: info.route,
      ...(info.action ? { action: info.action } : {}),
    });
    notifyAiUsageChanged();
    notifyQuotaExhausted(info.detail, info.route);
    return "quota";
  }
  if (info.status === 429) {
    track("ai_rate_limited", {
      route: info.route,
      ...(info.action ? { action: info.action } : {}),
      ...(typeof info.retryAfter === "number" ? { retryAfter: info.retryAfter } : {}),
    });
    return "rate";
  }
  return "error";
}

/* ── Usage-change notification ────────────────────────────────────────────── */

/** Subscribers (FeatureAccessProvider) refetch /api/account/usage when this fires. */
const usageChangedListeners = new Set<() => void>();

/** Subscribe to "an AI credit was just consumed (or a quota block happened)". */
export function onAiUsageChanged(listener: () => void): () => void {
  usageChangedListeners.add(listener);
  return () => usageChangedListeners.delete(listener);
}

/** Fire from client code after any successful metered AI call. */
export function notifyAiUsageChanged(): void {
  for (const listener of usageChangedListeners) {
    try {
      listener();
    } catch {
      /* listeners must never break the app */
    }
  }
}

/* ── Quota-exhausted handler ──────────────────────────────────────────────── */

type QuotaExhaustedHandler = (info: { route?: string; detail?: string }) => void;
let quotaExhaustedHandler: QuotaExhaustedHandler | null = null;

/**
 * Register the app-wide "quota exhausted" gate (FeatureAccessProvider wires
 * this to the existing restriction modal). Returns an unsubscribe function.
 */
export function setQuotaExhaustedHandler(handler: QuotaExhaustedHandler | null): () => void {
  quotaExhaustedHandler = handler;
  return () => {
    if (quotaExhaustedHandler === handler) quotaExhaustedHandler = null;
  };
}

function notifyQuotaExhausted(detail?: string, route?: string): void {
  try {
    quotaExhaustedHandler?.({
      ...(route ? { route } : {}),
      ...(detail ? { detail } : {}),
    });
  } catch {
    /* never break the request path */
  }
}

async function callAI<T>(action: string, data: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data }),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      // Don't throw on user-initiated cancel
      throw new AIClientError("Request canceled.", "CANCELED", 0);
    }
    throw new AIClientError("Network error while contacting the AI service.", "NETWORK", 0);
  }

  let json: AIResponse<T>;
  try {
    json = (await res.json()) as AIResponse<T>;
  } catch {
    throw new AIClientError("The AI service returned an invalid response.", "UPSTREAM", res.status);
  }

  if (!res.ok || !json.success) {
    classifyAiFailure({
      route: "/api/ai",
      action,
      status: res.status,
      code: json.code,
      retryAfter: Number(res.headers.get("Retry-After")) || undefined,
      detail: json.error,
    });
    throw new AIClientError(json.error || "AI request failed.", json.code || "UPSTREAM", res.status);
  }

  // M6 — a successful metered dispatch consumed a credit; refresh usage hints.
  notifyAiUsageChanged();
  return json.data as T;
}

/** AbortController-backed wrapper so components can cancel in-flight requests. */
function withAbort() {
  const controller = new AbortController();
  return { signal: controller.signal, cancel: () => controller.abort() };
}

export const ai = {
  /** Generate a new professional summary from the whole profile. */
  async generateSummary(resume: Resume) {
    return callAI<{ content: string }>("generateSummary", resume);
  },

  /** Rewrite text professionally (grammar, spelling, structure, clarity). */
  async rewrite(text: string, tone?: "ats" | "impact" | "concise" | "expanded" | "professional") {
    return callAI<{ content: string }>("rewrite", { text, tone });
  },

  /** Improve tone: professionalism, confidence, readability, impact. */
  async improveTone(text: string) {
    return callAI<{ content: string }>("improveTone", { text });
  },

  /** ATS-optimize content, optionally against a job description. */
  async atsOptimization(content: string, jobDescription?: string) {
    return callAI<{ content: string }>("atsOptimization", { content, jobDescription });
  },

  /** Improve a list of bullet points. */
  async improveBulletPoints(bullets: string[]) {
    return callAI<{ content: string[] }>("improveBulletPoints", { bullets });
  },

  /** Generate achievement bullets for an experience entry. */
  async generateAchievements(experience: Experience) {
    return callAI<{ content: string[] }>("generateAchievements", experience);
  },

  /** Generate a description for a project. */
  async generateProjects(project: Project) {
    return callAI<{ content: string }>("generateProjects", project);
  },

  /** Suggest relevant missing skills. */
  async suggestSkills(resume: Resume) {
    return callAI<{ content: string[] }>("suggestSkills", resume);
  },

  /** Full resume analysis (ATS score, sections, suggestions). */
  async analyzeResume(resume: Resume) {
    return callAI<ResumeAnalysis>("analyzeResume", resume);
  },

  /** Interview preparation based on the resume. */
  async interviewPreparation(resume: Resume, topic?: string) {
    return callAI<{ content: string }>("interviewPreparation", { resume, topic });
  },

  /** Analyze resume vs. job description match. */
  async analyzeJobMatch(resume: Resume, jobDescription: string) {
    return callAI<{
      overallScore: number | null;
      matchedSkills: string[];
      missingSkills: string[];
      recommendedKeywords: string[];
      suggestions: string[];
    }>("analyzeJobMatch", { resume, jobDescription });
  },

  /** Optimize resume for a target role + job description. */
  async optimizeForJob(resume: Resume, jobDescription: string, targetRole: string) {
    return callAI<{ summary: string; suggestions: string[] }>("optimizeForJob", {
      resume,
      jobDescription,
      targetRole,
    });
  },

  /** M4 — Evidence-grounded resume optimization with traceability. */
  async evidenceOptimize(
    resume: Resume,
    careerProfile: CareerProfile,
    jobProfile: JobProfile,
    qualificationMatch: QualificationMatch,
    jobDescription: string,
    signal?: AbortSignal,
  ) {
    return callAI<EvidenceOptimizerResult>("evidenceOptimize", {
      resume,
      careerProfile,
      jobProfile,
      qualificationMatch,
      jobDescription,
    }, signal);
  },

  /** Identify candidate Claims from the Professional Identity (review only, never auto-create). */
  async generateClaims(identity: Resume, existingClaims?: SuggestedClaim[]) {
    return callAI<{ claims: SuggestedClaim[] }>("generateClaims", { identity, existingClaims });
  },
};

export { withAbort };
