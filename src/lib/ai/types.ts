"use strict";

/**
 * AI Provider Adapter Contract
 *
 * Every LLM provider (OpenAI today, Anthropic tomorrow) implements this interface.
 * The AI Service Layer depends only on this contract, so new providers can be added
 * without touching frontend code.
 */

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProviderOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}

export interface AIProviderResult {
  content: string;
  provider: string;
  model: string;
}

export type AIErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UPSTREAM"
  | "UNSUPPORTED_ACTION";

export class AIError extends Error {
  code: AIErrorCode;
  userFacing: boolean;
  status: number;

  constructor(
    message: string,
    code: AIErrorCode,
    opts: { status?: number; userFacing?: boolean } = {},
  ) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.status = opts.status ?? 500;
    this.userFacing = opts.userFacing ?? true;
  }
}

export interface AIProvider {
  readonly name: string;
  complete(
    messages: AIChatMessage[],
    options?: AIProviderOptions,
  ): Promise<AIProviderResult>;
}

// ── Milestone 3: AI Resume Optimization ──────────────────────────────────────

/** A single actionable suggestion produced by the resume scorer. */
export interface ScoreSuggestion {
  section: "experience" | "summary" | "skills" | "education" | "general";
  priority: "high" | "medium" | "low";
  text: string;
}

/** Full scoring result returned by POST /api/ai/score. */
export interface ResumeScore {
  /** Aggregate 0–100 score. */
  overall: number;
  breakdown: {
    /** Metric-driven, achievement-focused bullet quality. */
    impact: number;
    /** Action verb usage and readability. */
    clarity: number;
    /** Required sections present and populated. */
    completeness: number;
    /** ATS formatting and keyword density. */
    ats: number;
    /** How well the resume targets the provided job description. 0 if no JD. */
    tailoring: number;
  };
  suggestions: ScoreSuggestion[];
}

/** One improved-bullet suggestion for a specific experience entry. */
export interface BulletSuggestion {
  entryId: string;
  bulletIndex: number;
  original: string;
  improved: string;
  /** One-sentence explanation of what was changed and why. */
  reasoning: string;
}

/** Result returned by the streaming POST /api/ai/summary endpoint. */
export interface SummaryResult {
  generated: string;
  tone: "professional" | "technical" | "creative" | "academic";
}

/** ATS keyword audit returned by POST /api/ai/keywords. Requires a job description. */
export interface KeywordAnalysis {
  /** 0–100 keyword match score. */
  score: number;
  /** Keywords from the JD that appear in the resume. */
  present: string[];
  /** Important JD keywords absent from the resume. */
  missing: string[];
  /** Additional keywords worth adding even if not in the JD. */
  recommended: string[];
  /** Keyword → occurrence count in the resume. */
  density: Record<string, number>;
}

/** A single tailoring action the candidate can take to improve their JD match. */
export interface TailoringSuggestion {
  type: "rewrite-bullet" | "add-keyword" | "reorder-section" | "update-summary";
  /** Entry ID for bullet rewrites; section name for everything else. */
  target: string;
  suggestion: string;
}

/** Full job-description match report returned by POST /api/ai/match. */
export interface JdMatchResult {
  /** 0–100 overall match score. */
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  /** JD requirements with no coverage in the resume. */
  missingExperiences: string[];
  tailoringSuggestions: TailoringSuggestion[];
}