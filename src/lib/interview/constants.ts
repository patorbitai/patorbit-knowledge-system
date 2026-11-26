/**
 * Interview Preparation — shared domain constants.
 *
 * One source of truth for interview types, formats and question categories so
 * the AI prompts, validation schemas, API routes and UI stay in sync.
 */

export const INTERVIEW_TYPES = [
  { value: "technical_coding_test", label: "Technical coding test", group: "technical" },
  { value: "technical_interview", label: "Technical interview", group: "technical" },
  { value: "sql_assessment", label: "SQL assessment", group: "technical" },
  { value: "pyspark_assessment", label: "Python/PySpark assessment", group: "technical" },
  { value: "system_design", label: "System design", group: "technical" },
  { value: "architecture_discussion", label: "Architecture discussion", group: "technical" },
  { value: "managerial", label: "Managerial interview", group: "people" },
  { value: "hr", label: "HR interview", group: "people" },
  { value: "behavioral", label: "Behavioral interview", group: "people" },
  { value: "client_stakeholder", label: "Client/stakeholder conversation", group: "people" },
  { value: "general_discussion", label: "General discussion", group: "people" },
  { value: "mixed", label: "Mixed interview", group: "mixed" },
] as const;

export type InterviewTypeValue = (typeof INTERVIEW_TYPES)[number]["value"];

export const INTERVIEW_TYPE_VALUES = INTERVIEW_TYPES.map((t) => t.value) as [
  InterviewTypeValue,
  ...InterviewTypeValue[],
];

export function interviewTypeLabel(value: string): string {
  return INTERVIEW_TYPES.find((t) => t.value === value)?.label ?? "Interview";
}

/** True when the round is primarily technical (used to pick question domains). */
export function isTechnicalInterviewType(value: string): boolean {
  return INTERVIEW_TYPES.find((t) => t.value === value)?.group === "technical";
}

export const INTERVIEW_FORMATS = [
  { value: "video", label: "Video call" },
  { value: "phone", label: "Phone" },
  { value: "onsite", label: "On-site" },
  { value: "take_home", label: "Take-home" },
  { value: "unknown", label: "Not specified" },
] as const;

export const INTERVIEW_FORMAT_VALUES = INTERVIEW_FORMATS.map((f) => f.value) as [
  string,
  ...string[],
];

export const SENIORITY_LEVELS = [
  "Intern",
  "Junior",
  "Mid-level",
  "Senior",
  "Staff",
  "Lead",
  "Manager",
  "Director",
] as const;

export const PROFILE_STATUSES = ["active", "completed", "archived"] as const;
export const PROFILE_SOURCES = [
  "manual",
  "email_paste",
  "email_upload",
  "gmail",
  "outlook",
  "application",
] as const;
export const ROUND_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export const SESSION_STATUSES = ["in_progress", "paused", "completed", "abandoned"] as const;

export const QUESTION_CATEGORIES = [
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
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  sql: "SQL",
  python: "Python",
  pyspark: "PySpark",
  azure: "Azure",
  databricks: "Databricks",
  data_engineering: "Data engineering",
  data_pipelines: "Data pipelines",
  data_modeling: "Data modeling",
  system_design: "System design",
  architecture: "Architecture",
  behavioral: "Behavioral",
  hr: "HR",
  managerial: "Managerial",
};

export function categoryLabel(value: string | null | undefined): string {
  // Stored plan content is JSON, so an older or partial row can lack a
  // category — never let a missing label crash a page.
  if (!value) return "Uncategorised";
  return CATEGORY_LABELS[value] ?? value.replace(/_/g, " ");
}

/** Fields returned by email extraction, in display order. */
export const EXTRACTION_FIELDS = [
  "company",
  "jobTitle",
  "experienceYears",
  "recruiterName",
  "interviewDate",
  "timezone",
  "durationMinutes",
  "roundName",
  "interviewType",
  "meetingPlatform",
  "requiredSkills",
  "jobDescription",
] as const;

export type ExtractionField = (typeof EXTRACTION_FIELDS)[number];

export const EXTRACTION_FIELD_LABELS: Record<ExtractionField, string> = {
  company: "Company",
  jobTitle: "Position",
  experienceYears: "Required experience (years)",
  recruiterName: "Recruiter / interviewer",
  interviewDate: "Interview date and time",
  timezone: "Timezone",
  durationMinutes: "Duration (minutes)",
  roundName: "Interview round",
  interviewType: "Interview type",
  meetingPlatform: "Meeting platform",
  requiredSkills: "Technical skills mentioned",
  jobDescription: "Job description / instructions",
};

/** Usage features metered by the existing usage service. */
export const INTERVIEW_USAGE = {
  preparation: "interview_preparation",
  practice: "interview_practice_session",
  mock: "interview_mock_session",
} as const;

/** Maximum characters accepted from an uploaded/pasted email. */
export const MAX_EMAIL_CHARS = 40_000;
/** Maximum upload size (bytes) — 8 MB. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
