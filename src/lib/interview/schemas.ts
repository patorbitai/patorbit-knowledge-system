/**
 * Zod contracts for Interview Preparation.
 *
 * Every request body and every AI response passes through one of these
 * schemas — the API never trusts client input and never persists unvalidated
 * model output.
 */
import { z } from "zod";
import {
  INTERVIEW_FORMATS,
  INTERVIEW_TYPE_VALUES,
  MAX_EMAIL_CHARS,
  PROFILE_SOURCES,
  QUESTION_CATEGORIES,
  ROUND_STATUSES,
} from "./constants";

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

export const isoDateTime = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Must be a valid date/time");

/** ── Interview profile ─────────────────────────────────────────────────── */

export const interviewProfileCreateSchema = z.object({
  companyName: trimmed(1, 160),
  jobTitle: trimmed(1, 160),
  experienceYears: z.coerce.number().min(0).max(60).nullish(),
  jobDescription: z.string().max(20_000).nullish(),
  requiredSkills: z.array(trimmed(1, 60)).max(40).default([]),
  preferredSkills: z.array(trimmed(1, 60)).max(40).default([]),
  seniority: z.string().max(40).nullish(),
  interviewDate: isoDateTime.nullish(),
  timezone: z.string().max(64).default("UTC"),
  durationMinutes: z.coerce.number().int().min(5).max(600).nullish(),
  interviewRound: z.string().max(80).nullish(),
  interviewFormat: z.enum(INTERVIEW_FORMATS.map((f) => f.value) as [string, ...string[]]).default("unknown"),
  interviewType: z.enum(INTERVIEW_TYPE_VALUES),
  notes: z.string().max(5000).nullish(),
  applicationId: z.string().max(64).nullish(),
  source: z.enum(PROFILE_SOURCES).default("manual"),
});

export const interviewProfileUpdateSchema = interviewProfileCreateSchema.partial().extend({
  status: z.enum(["active", "completed", "archived"]).optional(),
});

// "input" types: fields with schema defaults stay optional for callers, because
// the service layer runs the schema through `.parse()` before using the values.
export type InterviewProfileCreateInput = z.input<typeof interviewProfileCreateSchema>;
export type InterviewProfileUpdateInput = z.input<typeof interviewProfileUpdateSchema>;

/** ── Rounds ────────────────────────────────────────────────────────────── */

export const interviewRoundCreateSchema = z.object({
  roundName: trimmed(1, 120),
  roundType: z.enum(INTERVIEW_TYPE_VALUES),
  interviewDate: isoDateTime.nullish(),
  timezone: z.string().max(64).default("UTC"),
  durationMinutes: z.coerce.number().int().min(5).max(600).nullish(),
  status: z.enum(ROUND_STATUSES).default("scheduled"),
  notes: z.string().max(5000).nullish(),
});

export const interviewRoundUpdateSchema = interviewRoundCreateSchema.partial();

export type InterviewRoundCreateInput = z.input<typeof interviewRoundCreateSchema>;

/** ── Email import ──────────────────────────────────────────────────────── */

export const emailExtractSchema = z.object({
  content: z.string().min(20, "Paste the email body so it can be read.").max(MAX_EMAIL_CHARS),
  subject: z.string().max(300).nullish(),
  sender: z.string().max(300).nullish(),
  sourceType: z.enum(["paste", "upload", "gmail", "outlook"]).default("paste"),
});

export const emailAttachSchema = emailExtractSchema.extend({
  interviewProfileId: z.string().min(1),
  extractedFields: z.unknown().nullish(),
});

/** ── AI output: extraction ─────────────────────────────────────────────── */

const fieldOrigin = z.enum(["explicit", "inferred"]);

export const extractedFieldValueSchema = z.object({
  value: z.union([z.string(), z.number(), z.array(z.string())]).nullable(),
  evidence: z.string().max(600).default(""),
  confidence: z.number().min(0).max(1).default(0),
  origin: fieldOrigin.default("explicit"),
});

export const extractionResultSchema = z.object({
  fields: z.record(z.string(), extractedFieldValueSchema).default({}),
  notes: z.array(z.string().max(400)).max(8).default([]),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type ExtractedFieldValue = z.infer<typeof extractedFieldValueSchema>;

/** ── AI output: preparation plan + questions ───────────────────────────── */

export const questionSchema = z.object({
  id: z.string().max(60).optional(),
  category: z.enum(QUESTION_CATEGORIES),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  question: trimmed(5, 2000),
  answerFramework: z.string().max(3000).default(""),
  followUps: z.array(z.string().max(600)).max(5).default([]),
});

export const planTopicSchema = z.object({
  name: trimmed(2, 120),
  category: z.enum(QUESTION_CATEGORIES),
  why: z.string().max(600).default(""),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

export const preparationPlanSchema = z.object({
  summary: z.string().max(2000).default(""),
  roadmap: z
    .array(
      z.object({
        step: trimmed(2, 160),
        detail: z.string().max(800).default(""),
        effort: z.string().max(80).default(""),
      }),
    )
    .max(12)
    .default([]),
  topics: z.array(planTopicSchema).max(24).default([]),
  questions: z.array(questionSchema).max(40).default([]),
  projectDiscussionTopics: z.array(z.string().max(400)).max(12).default([]),
  practiceSequence: z.array(z.string().max(200)).max(20).default([]),
  // Honesty flag: true when no verified company-specific process was available.
  generalRoleBased: z.boolean().default(true),
});

export type PreparationPlanContent = z.infer<typeof preparationPlanSchema>;

export const questionBankSchema = z.object({
  questions: z.array(questionSchema).min(1).max(20),
  generalRoleBased: z.boolean().default(true),
});

/** ── AI output: evaluation + report ────────────────────────────────────── */

export const EVALUATION_DIMENSIONS = [
  "technicalAccuracy",
  "conceptualUnderstanding",
  "completeness",
  "problemSolving",
  "practicalApplication",
  "communicationClarity",
] as const;

export type EvaluationDimension = (typeof EVALUATION_DIMENSIONS)[number];

const dimensionScore = z.object({
  score: z.number().min(0).max(5),
  evidence: z.string().max(800).default(""),
});

export const answerEvaluationSchema = z.object({
  dimensions: z.record(z.string(), dimensionScore).default({}),
  strengths: z.array(z.string().max(500)).max(6).default([]),
  improvements: z.array(z.string().max(500)).max(6).default([]),
  idealAnswerFramework: z.string().max(3000).default(""),
  followUpQuestion: z.string().max(1000).nullable().default(null),
  topic: z.string().max(80).default(""),
});

export type AnswerEvaluation = z.infer<typeof answerEvaluationSchema>;

export const mockReportSchema = z.object({
  overview: z.string().max(2500).default(""),
  strengths: z.array(z.string().max(400)).max(8).default([]),
  improvements: z.array(z.string().max(400)).max(8).default([]),
  strongestTopics: z.array(z.string().max(80)).max(8).default([]),
  weakestTopics: z.array(z.string().max(80)).max(8).default([]),
  recommendations: z.array(z.string().max(500)).max(8).default([]),
  generalRoleBased: z.boolean().default(true),
});

export type MockReportContent = z.infer<typeof mockReportSchema>;

/** ── Sessions ──────────────────────────────────────────────────────────── */

export const sessionStartSchema = z.object({
  sessionType: z.enum(["practice", "mock"]).default("practice"),
  roundId: z.string().max(64).nullish(),
  categories: z.array(z.enum(QUESTION_CATEGORIES)).max(6).default([]),
  questionCount: z.coerce.number().int().min(1).max(12).default(5),
});

export const sessionAnswerSchema = z.object({
  questionId: z.string().min(1).max(80),
  answer: z.string().trim().min(1, "Write an answer before submitting.").max(8000),
});

export const sessionStateSchema = z.object({
  status: z.enum(["in_progress", "paused", "abandoned"]),
});

export const savedQuestionSchema = z.object({
  interviewProfileId: z.string().max(64).nullish(),
  sessionId: z.string().max(64).nullish(),
  category: z.enum(QUESTION_CATEGORIES),
  difficulty: z.enum(["easy", "medium", "hard"]).nullish(),
  text: trimmed(5, 2000),
  suggestedAnswer: z.string().max(4000).nullish(),
});
