import { describe, it, expect, afterEach, beforeEach } from "vitest";
import {
  INTERVIEW_TYPES,
  isTechnicalInterviewType,
  interviewTypeLabel,
  categoryLabel,
  INTERVIEW_USAGE,
  QUESTION_CATEGORIES,
  EXTRACTION_FIELDS,
} from "@/lib/interview/constants";
import {
  interviewProfileCreateSchema,
  answerEvaluationSchema,
  extractionResultSchema,
  sessionStartSchema,
  sessionAnswerSchema,
  preparationPlanSchema,
} from "@/lib/interview/schemas";
import { encryptToken, decryptToken, safeEqual } from "@/lib/interview/crypto";
import { isProviderConfigured, providerConfig, buildAuthUrl, newState, PROVIDER_SCOPES } from "@/lib/interview/oauth";

describe("interview taxonomy", () => {
  it("offers all twelve interview types", () => {
    expect(INTERVIEW_TYPES).toHaveLength(12);
    expect(new Set(INTERVIEW_TYPES.map((type) => type.value)).size).toBe(12);
  });

  it("does not treat every interview as technical", () => {
    expect(isTechnicalInterviewType("technical_interview")).toBe(true);
    expect(isTechnicalInterviewType("sql_assessment")).toBe(true);
    expect(isTechnicalInterviewType("hr_interview")).toBe(false);
    expect(isTechnicalInterviewType("behavioral_interview")).toBe(false);
    expect(isTechnicalInterviewType("managerial_interview")).toBe(false);
    expect(isTechnicalInterviewType("client_conversation")).toBe(false);
  });

  it("labels known types and degrades gracefully for unknown ones", () => {
    expect(interviewTypeLabel("system_design")).toMatch(/system design/i);
    expect(interviewTypeLabel("unknown_type")).toBe("Interview");
  });

  it("covers every required practice category", () => {
    for (const category of [
      "sql",
      "python",
      "pyspark",
      "azure",
      "databricks",
      "data_engineering",
      "data_pipelines",
      "data_modeling",
      "system_design",
      "architecture",
      "behavioral",
      "hr",
      "managerial",
    ]) {
      expect(QUESTION_CATEGORIES).toContain(category);
      expect(categoryLabel(category)).not.toBe(category);
    }
  });

  it("exposes the metered usage keys used by the API", () => {
    expect(INTERVIEW_USAGE).toEqual({
      preparation: "interview_preparation",
      practice: "interview_practice_session",
      mock: "interview_mock_session",
    });
  });

  it("declares the extraction fields shown in the review screen", () => {
    expect(EXTRACTION_FIELDS).toContain("company");
    expect(EXTRACTION_FIELDS).toContain("interviewDate");
    expect(EXTRACTION_FIELDS).toContain("timezone");
  });
});

describe("interview profile validation", () => {
  const base = { companyName: "Contoso", jobTitle: "Senior Data Engineer" };

  it("accepts a minimal profile and applies defaults", () => {
    const parsed = interviewProfileCreateSchema.parse({ ...base, interviewType: "general_discussion" });
    expect(parsed.interviewType).toBe("general_discussion");
    expect(parsed.timezone).toBeTruthy();
    expect(parsed.requiredSkills).toEqual([]);
    expect(parsed.interviewFormat).toBe("unknown");
  });

  it("requires an explicit interview type instead of assuming technical", () => {
    expect(interviewProfileCreateSchema.safeParse(base).success).toBe(false);
  });

  it("rejects a missing company or role", () => {
    expect(interviewProfileCreateSchema.safeParse({ jobTitle: "Engineer" }).success).toBe(false);
    expect(interviewProfileCreateSchema.safeParse({ companyName: "Contoso" }).success).toBe(false);
  });

  it("rejects an unknown interview type", () => {
    expect(interviewProfileCreateSchema.safeParse({ ...base, interviewType: "vibes" }).success).toBe(false);
  });

  it("rejects impossible experience and duration values", () => {
    expect(interviewProfileCreateSchema.safeParse({ ...base, experienceYears: 99 }).success).toBe(false);
    expect(interviewProfileCreateSchema.safeParse({ ...base, durationMinutes: 5 }).success).toBe(false);
  });

  it("rejects an unparseable interview date", () => {
    expect(interviewProfileCreateSchema.safeParse({ ...base, interviewDate: "next tuesday" }).success).toBe(false);
  });
});

describe("AI output validation", () => {
  it("keeps unknown extraction fields unknown instead of inventing values", () => {
    const parsed = extractionResultSchema.parse({ fields: { company: { value: null, confidence: 0 } } });
    expect(parsed.fields.company.value).toBeNull();
    expect(parsed.fields.company.origin).toBe("explicit");
  });

  it("rejects out-of-range evaluation scores", () => {
    const bad = answerEvaluationSchema.safeParse({ dimensions: { completeness: { score: 9 } } });
    expect(bad.success).toBe(false);
  });

  it("defaults missing evaluation collections", () => {
    const parsed = answerEvaluationSchema.parse({ dimensions: {} });
    expect(parsed.strengths).toEqual([]);
    expect(parsed.followUpQuestion).toBeNull();
  });

  it("requires at least a question in a plan", () => {
    const parsed = preparationPlanSchema.parse({ questions: [] });
    expect(parsed.questions).toEqual([]);
    expect(parsed.generalRoleBased).toBe(true);
  });

  it("defaults a practice session to five questions", () => {
    const parsed = sessionStartSchema.parse({});
    expect(parsed).toMatchObject({ sessionType: "practice", questionCount: 5, categories: [] });
  });

  it("rejects an empty answer and caps very long ones", () => {
    expect(sessionAnswerSchema.safeParse({ questionId: "q1", answer: "   " }).success).toBe(false);
    expect(sessionAnswerSchema.safeParse({ questionId: "q1", answer: "x".repeat(8001) }).success).toBe(false);
  });
});

describe("token encryption", () => {
  const originalSecret = process.env.AUTH_SECRET;
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-for-interview-token-encryption";
  });
  afterEach(() => {
    process.env.AUTH_SECRET = originalSecret;
  });

  it("round-trips a token", () => {
    const encrypted = encryptToken("ya29.super-secret-refresh-token");
    expect(encrypted).not.toContain("super-secret");
    expect(decryptToken(encrypted)).toBe("ya29.super-secret-refresh-token");
  });

  it("detects tampering", () => {
    const encrypted = encryptToken("token-value");
    const tampered = `${encrypted.slice(0, -2)}AA`;
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("compares secrets in constant time", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
  });
});

describe("mailbox OAuth configuration", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = original.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = original.GOOGLE_CLIENT_SECRET;
  });

  it("reports a provider as unconfigured when credentials are absent", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isProviderConfigured("google")).toBe(false);
    expect(() => providerConfig("google")).toThrow(/not configured/);
  });

  it("requests read-only scopes only", () => {
    expect(PROVIDER_SCOPES.google).toContain("gmail.readonly");
    expect(PROVIDER_SCOPES.google).not.toContain("gmail.send");
    expect(PROVIDER_SCOPES.google).not.toContain("mail.google.com");
    expect(PROVIDER_SCOPES.microsoft).toContain("Mail.Read");
    expect(PROVIDER_SCOPES.microsoft).not.toContain("Mail.Send");
  });

  it("builds an auth URL with state and the exact callback", () => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    const state = newState();
    const url = new URL(buildAuthUrl("google", "http://localhost:3000", state));
    expect(url.searchParams.get("state")).toBe(state);
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/interview/connections/google/callback",
    );
    expect(url.searchParams.get("scope")).toContain("gmail.readonly");
  });

  it("generates unpredictable state values", () => {
    expect(newState()).not.toBe(newState());
  });
});
