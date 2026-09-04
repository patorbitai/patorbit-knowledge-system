"use strict";

/**
 * AI Service Layer
 *
 * The application's single entry point for all AI capabilities. The frontend
 * never calls a provider directly — it calls this service, which bundles every
 * supported AI action into one documented class. This makes it trivial to add,
 * remove, or swap AI models without changing any UI code.
 */
import type {
  Resume,
  Experience,
  Project,
  ResumeAnalysis,
  Suggestion,
  SuggestedClaim,
} from "@/types/resume";
import type {
  AIChatMessage,
  AIProvider,
  AIProviderOptions,
} from "./types";
import { getAIProvider } from "./provider";
import * as Prompts from "./prompts";
import { buildEvidenceOptimizerPrompt } from "./evidence-optimizer-prompt";
import { validateOptimizerChanges } from "./evidence-validator";
import {
  buildPhases,
  computeResumeScoreDetail,
  computeTrustScoreDetail,
} from "./scoring";
import type { CareerProfile } from "@/types/career-profile";
import type { JobProfile } from "@/types/job-profile";
import type { QualificationMatch } from "@/types/qualification-match";
import type { EvidenceOptimizerResult } from "@/types/evidence-optimizer";

export type AIAction =
  | "generateSummary"
  | "rewrite"
  | "improveTone"
  | "atsOptimization"
  | "improveBulletPoints"
  | "generateProjects"
  | "suggestSkills"
  | "analyzeResume"
  | "generateAchievements"
  | "interviewPreparation"
  | "analyzeJobMatch"
  | "optimizeForJob"
  | "evidenceOptimize"
  | "generateClaims"
  | "extractResume"
  | "tailorResume";

/** Known action → handler map. The API route dispatches on these keys. */
type ActionHandlers = {
  [K in AIAction]: (data: never) => Promise<unknown>;
};

export class AIService {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider || getAIProvider();
  }

  /**
   * Dispatch an AI action to the correct handler. The API route uses this to
   * avoid a giant switch statement. Throws an AIError if the action is
   * unsupported.
   */
  async dispatch(action: AIAction, data: unknown): Promise<unknown> {
    const handler = this.actionHandlers[action];
    if (!handler) {
      throw new Error(`Unsupported AI action: ${action}`);
    }
    // Cast to match the handler signature which accepts `never` (a union of all action types)
    return handler.call(this, data as never);
  }

  // ── Individual AI Action Handlers ──

  async generateSummary(resume: Resume): Promise<{ content: string }> {
    const { system, user } = Prompts.generateSummary(resume);
    const result = await this.complete(system, user);
    return { content: result };
  }

  async rewrite(data: { text: string; tone?: string }): Promise<{ content: string }> {
    const { system, user } = Prompts.rewrite(data.text, data.tone);
    const result = await this.complete(system, user);
    return { content: result };
  }

  async improveTone(data: { text: string }): Promise<{ content: string }> {
    const { system, user } = Prompts.improveTone(data.text);
    const result = await this.complete(system, user);
    return { content: result };
  }

  async atsOptimization(data: { content: string; jobDescription?: string }): Promise<{ content: string }> {
    const { system, user } = Prompts.atsOptimization(data);
    const result = await this.complete(system, user);
    return { content: result };
  }

  async improveBulletPoints(data: { bullets: string[] }): Promise<{ content: string[] }> {
    const { system, user } = Prompts.improveBulletPoints(data.bullets);
    const result = await this.complete(system, user, { maxTokens: 512 });
    return { content: splitLines(result) };
  }

  async generateAchievements(experience: Experience): Promise<{ content: string[] }> {
    const { system, user } = Prompts.generateAchievements(experience);
    const result = await this.complete(system, user, { maxTokens: 512 });
    return { content: splitLines(result) };
  }

  async generateProjects(project: Project): Promise<{ content: string }> {
    const { system, user } = Prompts.generateProjectDescription(project);
    const result = await this.complete(system, user);
    return { content: result };
  }

  async suggestSkills(resume: Resume): Promise<{ content: string[] }> {
    const { system, user } = Prompts.suggestSkills(resume);
    const result = await this.complete(system, user, { maxTokens: 128 });
    return { content: splitList(result) };
  }

  async analyzeResume(resume: Resume): Promise<ResumeAnalysis> {
    const phases = buildPhases();
    const ph = (idx: number, status: ResumeAnalysis["phases"][number]["status"]) => { phases[idx].status = status; };

    // 1. Deterministic, explainable scores (career-stage-aware).
    //    These never come from the LLM — they are computed from the data so
    //    the Trust Score stays reproducible and explainable.
    ph(0, "active");
    const resumeScore = computeResumeScoreDetail(resume);
    const trustScore = computeTrustScoreDetail(resume);
    ph(0, "complete");
    ph(1, "active");
    ph(2, "active");
    ph(3, "active");
    ph(4, "active");

    // 2. LLM enrichment for qualitative analysis. The LLM identifies weak
    //    bullets, weak verbs, missing metrics, and actionable suggestions.
    let qualitative: {
      weakBulletPoints?: string[];
      weakActionVerbs?: string[];
      missingMetrics?: string[];
      missingSections?: string[];
      atsScore?: number;
      professionalImpact?: number;
      suggestions?: { section?: string; field?: string; suggestion?: string }[];
    } = {};

    try {
      const { system, user } = Prompts.analyzeResume(resume);
      const result = await this.complete(system, user, { maxTokens: 1024, jsonMode: true });
      const parsed = JSON.parse(result);
      qualitative = parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      // LLM failure should not break the whole analysis — fall back to
      // deterministic-only results rather than failing the UI.
      qualitative = {};
    }

    // 3. Merge into the full ResumeAnalysis shape the UI expects.
    const hasSummary = !!resume.summary;
    const expCount = resume.experience.length;
    const eduCount = resume.education.length;
    const skillCount = resume.skills.length;
    const hasLinkedIn = !!resume.social.linkedin;
    const hasGitHub = !!resume.social.github;
    const hasPortfolio = !!resume.social.portfolio;

    const missingSections: string[] = [];
    if (!hasSummary) missingSections.push("Professional Summary");
    if (expCount === 0) missingSections.push("Experience");
    if (expCount < 2) missingSections.push("More Experience (2+ roles recommended)");
    if (eduCount === 0) missingSections.push("Education");
    if (skillCount < 5) missingSections.push("More Skills (5+ recommended)");
    if (!hasLinkedIn) missingSections.push("LinkedIn Profile");
    if (!hasGitHub) missingSections.push("GitHub Profile");

    // Prefer LLM-identified sections; merge with deterministic missing sections.
    const llmMissing = (qualitative.missingSections ?? []).filter(Boolean) as string[];
    const mergedMissingSections = Array.from(new Set([...missingSections, ...llmMissing]));

    // Build suggestions in the UI's expected shape.
    const suggestions: Suggestion[] = [];
    (qualitative.suggestions ?? []).slice(0, 6).forEach((s, i) => {
      if (s && s.suggestion) {
        suggestions.push({
          id: `ai-sug-${i}`,
          section: s.section || "resume",
          field: s.field || "description",
          original: "",
          suggestion: s.suggestion,
          type: "improvement",
        });
      }
    });

    // Deterministic fallback suggestions when the LLM is unavailable.
    if (suggestions.length === 0) {
      if (!hasSummary) {
        suggestions.push({ id: "sug-1", section: "summary", field: "summary", original: "", suggestion: "Add a professional summary highlighting your key achievements and career trajectory.", type: "improvement" });
      }
      if (expCount > 0 && !resume.experience.some((e) => /\d+%|\$\d+|\d+x/i.test(e.description || ""))) {
        suggestions.push({ id: "sug-2", section: "experience", field: "description", original: "", suggestion: "Add metrics to your bullet points (e.g., 'Improved efficiency by 35%') to boost ATS scores.", type: "ats" });
      }
      if (skillCount < 8) {
        suggestions.push({ id: "sug-3", section: "skills", field: "name", original: "", suggestion: "Consider adding more skills (8+ recommended) to improve keyword matching.", type: "rewrite" });
      }
    }

    ph(1, "complete");
    ph(2, "complete");
    ph(3, "complete");
    ph(4, "complete");

    return {
      status: "complete",
      phases,
      resumeScore,
      trustScore,
      atsScore: typeof qualitative.atsScore === "number" ? qualitative.atsScore : (expCount > 0 && skillCount > 0 ? Math.min(100, 40 + Math.min(expCount * 8, 25) + Math.min(skillCount * 3, 20) + (hasSummary ? 15 : 0)) : null),
      professionalImpact: typeof qualitative.professionalImpact === "number" ? qualitative.professionalImpact : (expCount > 0 && resume.experience.some((e) => e.bulletPoints?.length > 0) ? Math.min(100, 40 + expCount * 10 + resume.experience.filter((e) => e.bulletPoints?.length > 2).length * 10) : null),
      missingSections: mergedMissingSections,
      weakBulletPoints: (qualitative.weakBulletPoints ?? []).filter(Boolean) as string[],
      weakActionVerbs: (qualitative.weakActionVerbs ?? []).filter(Boolean) as string[],
      missingMetrics: (qualitative.missingMetrics ?? []).filter(Boolean) as string[],
      missingCertifications: resume.certifications.length === 0 ? ["No certifications listed — relevant certs can boost credibility"] : [],
      missingSocialLinks: !hasLinkedIn || !hasGitHub || !hasPortfolio ? [...(!hasLinkedIn ? ["LinkedIn"] : []), ...(!hasGitHub ? ["GitHub"] : []), ...(!hasPortfolio ? ["Portfolio"] : [])] : [],
      suggestions,
    };
  }

  async interviewPreparation(data: { resume: Resume; topic?: string }): Promise<{ content: string }> {
    const { system, user } = Prompts.interviewPreparation(data);
    const result = await this.complete(system, user, { maxTokens: 1536 });
    return { content: result };
  }

  async analyzeJobMatch(data: {
    resume: Resume;
    jobDescription: string;
  }): Promise<Record<string, unknown>> {
    const { system, user } = Prompts.analyzeJobMatch(data);
    const result = await this.complete(system, user, { maxTokens: 1024, jsonMode: true });
    return JSON.parse(result);
  }

  async optimizeForJob(data: {
    resume: Resume;
    jobDescription: string;
    targetRole: string;
  }): Promise<{ summary: string; suggestions: string[] }> {
    const { system, user } = Prompts.optimizeForJob(data);
    const result = await this.complete(system, user, { maxTokens: 1024, jsonMode: true });
    const parsed = JSON.parse(result) as { summary?: string; suggestions?: unknown };
    return {
      summary: parsed.summary ?? "",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [],
    };
  }

  /**
   * M4 — Evidence-grounded resume optimizer.
   * Uses Career Profile (M1), Job Profile (M2), and Qualification Match (M3)
   * to produce traceable, non-fabricated resume improvements.
   */
  async evidenceOptimize(data: {
    resume: Resume;
    careerProfile: CareerProfile;
    jobProfile: JobProfile;
    qualificationMatch: QualificationMatch;
    jobDescription: string;
  }): Promise<EvidenceOptimizerResult> {
    const { system, user } = buildEvidenceOptimizerPrompt(data);
    const result = await this.complete(system, user, { maxTokens: 4096, jsonMode: true });
    const parsed = JSON.parse(result) as Record<string, unknown>;

    // Normalize the result into our type
    const changes = Array.isArray(parsed.changes)
      ? (parsed.changes as EvidenceOptimizerResult["changes"])
      : [];

    const gaps = Array.isArray(parsed.gaps)
      ? (parsed.gaps as EvidenceOptimizerResult["gaps"])
      : [];

    const result_: EvidenceOptimizerResult = {
      targetRole: typeof parsed.targetRole === "string" ? parsed.targetRole : "",
      companyName: typeof parsed.companyName === "string" ? parsed.companyName : "",
      preMatchScore: typeof parsed.preMatchScore === "number" ? parsed.preMatchScore : 0,
      postMatchScore: typeof parsed.postMatchScore === "number" ? parsed.postMatchScore : 0,
      changes: changes.map((c, i) => ({
        id: c.id || `change-${i + 1}`,
        section: c.section || "general",
        original: c.original || "",
        optimized: c.optimized || "",
        reason: c.reason || "",
        qualification: c.qualification || "PROVEN",
        supportingEvidence: Array.isArray(c.supportingEvidence) ? c.supportingEvidence : [],
        confidence: typeof c.confidence === "number" ? c.confidence : 0.5,
      })),
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      gaps: gaps.map((g) => ({
        requirement: g.requirement || "",
        reason: g.reason || "",
        classification: "MISSING" as const,
        suggestion: g.suggestion,
      })),
      createdAt: new Date().toISOString(),
    };

    // Deterministic anti-fabrication validation
    const validation = validateOptimizerChanges(result_.changes, data.careerProfile);
    if (!validation.valid) {
      // Remove changes that failed validation
      const violatingIds = new Set(validation.violations.map((v) => v.changeId));
      result_.changes = result_.changes.filter((c) => !violatingIds.has(c.id));
    }

    return result_;
  }

  /**
   * C33 — Generate a tailored resume from Professional Identity + Job Description.
   * Returns the full tailored resume payload plus match analysis.
   */
  async tailorResume(data: {
    resume: Resume;
    jobDescription: string;
  }): Promise<Record<string, unknown>> {
    const { system, user } = Prompts.tailorResume(data);
    const result = await this.complete(system, user, { maxTokens: 4096, jsonMode: true });
    return JSON.parse(result);
  }

  // ── Professional Identity: Claim Generation (PKS-SRS-PIP-1 §2.3) ──

  /**
   * Identify candidate Claims from the user's Professional Identity.
   * Returns suggestions only — never creates claims. The user explicitly
   * accepts/edits/rejects each suggestion (Claims Review workflow).
   */
  async generateClaims(data: {
    identity: Resume;
    existingClaims?: SuggestedClaim[];
  }): Promise<{ claims: SuggestedClaim[] }> {
    const { system, user } = Prompts.generateClaims(data);
    const result = await this.complete(system, user, { maxTokens: 1024, jsonMode: true });
    const parsed = JSON.parse(result) as { claims?: unknown };

    // Gemini JSON mode sometimes returns arrays as objects with numeric keys
    // (e.g. { "0": {...}, "1": {...} } instead of [{...}, {...}]).
    // Normalize both cases into a real array.
    let raw: SuggestedClaim[] = [];
    if (Array.isArray(parsed.claims)) {
      raw = parsed.claims as SuggestedClaim[];
    } else if (parsed.claims && typeof parsed.claims === "object") {
      const obj = parsed.claims as Record<string, unknown>;
      const numericKeys = Object.keys(obj).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b));
      if (numericKeys.length > 0) {
        raw = numericKeys.map((k) => obj[k] as SuggestedClaim);
      }
    }
    const claims = raw
      .filter((c) => c && typeof c.assertionText === "string" && c.assertionText.trim().length > 0)
      .map((c) => ({
        assertionText: c.assertionText.trim(),
        claimType: c.claimType ?? "Contribution",
        sourceActivityId: c.sourceActivityId ?? "",
        confidence: typeof c.confidence === "number" ? c.confidence : 0.5,
        reasoning: c.reasoning ?? "",
      }));

    return { claims };
  }

  /**
   * Extract structured resume data from raw text (PDF / DOCX import).
   * Returns a partial resume object — callers must apply withIds before
   * passing to Zod validation.
   */
  async extractResume(data: { rawText: string }): Promise<Record<string, unknown>> {
    const { system, user } = Prompts.extractResume(data.rawText);
    const result = await this.complete(system, user, {
      maxTokens: 4096,
      jsonMode: true,
    });
    return JSON.parse(result) as Record<string, unknown>;
  }

  // ── Internal helper ──

  private async complete(system: string, user: string, options?: AIProviderOptions): Promise<string> {
    const messages: AIChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
    const result = await this.provider.complete(messages, options);
    return result.content;
  }

  private readonly actionHandlers: ActionHandlers = {
    generateSummary: this.generateSummary,
    rewrite: this.rewrite,
    improveTone: this.improveTone,
    atsOptimization: this.atsOptimization,
    improveBulletPoints: this.improveBulletPoints,
    generateAchievements: this.generateAchievements,
    generateProjects: this.generateProjects,
    suggestSkills: this.suggestSkills,
    analyzeResume: this.analyzeResume,
    interviewPreparation: this.interviewPreparation,
    analyzeJobMatch: this.analyzeJobMatch,
    optimizeForJob: this.optimizeForJob,
    evidenceOptimize: this.evidenceOptimize,
    generateClaims: this.generateClaims,
    extractResume: this.extractResume,
    tailorResume: this.tailorResume,
  };
}

/** Split provider text into trimmed, non-empty lines (for bullet output). */
function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

/** Split a comma-separated list into trimmed entries. */
function splitList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Singleton instance for server-side use (e.g. the /api/ai route). */
let serviceInstance: AIService | null = null;
export function getAIService(): AIService {
  if (!serviceInstance) {
    serviceInstance = new AIService();
  }
  return serviceInstance;
}