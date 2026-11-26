"use strict";

import { prisma } from "@/lib/prisma";
import { getAIService } from "@/lib/ai/service";
import {
  EXTRACTION_FIELDS,
  MAX_EMAIL_CHARS,
  type ExtractionField,
} from "@/lib/interview/constants";
import { sanitizeUntrustedText, wrapUntrusted } from "@/lib/interview/security";
import type { ExtractedFieldValue, ExtractionResult } from "@/lib/interview/schemas";
import { InterviewNotFoundError } from "./interview-profile.service";

export interface ExtractionResponse {
  fields: Record<string, ExtractedFieldValue>;
  notes: string[];
  suspicious: boolean;
  truncated: boolean;
  sourceType: string;
}

const EMPTY_FIELD: ExtractedFieldValue = {
  value: null,
  evidence: "",
  confidence: 0,
  origin: "explicit",
};

/** Keyword → interview type. Deterministic, so classification is testable. */
const TYPE_HINTS: { pattern: RegExp; value: string }[] = [
  { pattern: /\bpyspark|spark\b/i, value: "pyspark_assessment" },
  { pattern: /\bsql\b|query assessment/i, value: "sql_assessment" },
  { pattern: /system design/i, value: "system_design" },
  { pattern: /architect(ure)? (discussion|review)/i, value: "architecture_discussion" },
  { pattern: /coding (test|challenge|assessment)|hackerrank|codility|leetcode/i, value: "technical_coding_test" },
  { pattern: /hiring manager|managerial|people manage/i, value: "managerial" },
  { pattern: /\bhr\b|human resources|recruiter screen/i, value: "hr" },
  { pattern: /behaviou?ral|star (method|format)|competenc(y|ies) interview/i, value: "behavioral" },
  { pattern: /client|stakeholder/i, value: "client_stakeholder" },
  { pattern: /technical (interview|round|screen)/i, value: "technical_interview" },
  { pattern: /general (discussion|conversation)|introductory call/i, value: "general_discussion" },
];

const PLATFORM_HINTS: { pattern: RegExp; value: string }[] = [
  { pattern: /zoom/i, value: "Zoom" },
  { pattern: /microsoft teams|\bteams\b/i, value: "Microsoft Teams" },
  { pattern: /google meet|meet\.google/i, value: "Google Meet" },
  { pattern: /webex/i, value: "Webex" },
  { pattern: /bluejeans/i, value: "BlueJeans" },
  { pattern: /in person|on-?site|office/i, value: "On-site" },
];

const KNOWN_SKILLS = [
  "sql", "python", "pyspark", "spark", "azure", "aws", "gcp", "databricks",
  "snowflake", "airflow", "kafka", "dbt", "terraform", "kubernetes", "docker",
  "power bi", "tableau", "excel", "scala", "java", "typescript", "react",
  "node", "postgresql", "mysql", "mongodb", "redshift", "bigquery", "etl",
  "data modeling", "data warehouse", "machine learning",
];

function firstMatch(text: string, pattern: RegExp): { value: string; evidence: string } | null {
  const match = text.match(pattern);
  if (!match) return null;
  return { value: (match[1] ?? match[0]).trim(), evidence: match[0].slice(0, 200) };
}

/** Deterministic hints — these make extraction useful even without AI. */
export function deterministicExtraction(text: string, sender?: string | null): Record<string, ExtractedFieldValue> {
  const fields: Record<string, ExtractedFieldValue> = {};

  const dateMatch = text.match(
    /((?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+)?(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})(?:[^\n]{0,40}?(\d{1,2}:\d{2}\s*(?:am|pm)?(?:\s*[A-Z]{2,4})?))?/i,
  );
  if (dateMatch) {
    fields.interviewDate = {
      value: dateMatch[0].trim().slice(0, 120),
      evidence: dateMatch[0].trim().slice(0, 200),
      confidence: 0.55,
      origin: "explicit",
    };
  }

  const duration = firstMatch(text, /(\d{1,3})\s*(?:minutes?|mins?|min)\b/i) ?? firstMatch(text, /(\d(?:\.\d)?)\s*hour/i);
  if (duration) {
    const raw = Number(duration.value);
    const minutes = /hour/i.test(duration.evidence) ? Math.round(raw * 60) : raw;
    fields.durationMinutes = {
      value: minutes,
      evidence: duration.evidence,
      confidence: 0.6,
      origin: "explicit",
    };
  }

  const tz = firstMatch(text, /\b(UTC[+-]\d{1,2}(?::\d{2})?|[A-Z]{2,4}T|[A-Z][a-z]+\/[A-Z][a-z_]+)\b/);
  if (tz) {
    fields.timezone = { value: tz.value, evidence: tz.evidence, confidence: 0.5, origin: "explicit" };
  }

  const platform = PLATFORM_HINTS.find((hint) => hint.pattern.test(text));
  if (platform) {
    fields.meetingPlatform = {
      value: platform.value,
      evidence: platform.value,
      confidence: 0.6,
      origin: "explicit",
    };
  }

  const type = TYPE_HINTS.find((hint) => hint.pattern.test(text));
  if (type) {
    fields.interviewType = {
      value: type.value,
      evidence: (text.match(type.pattern)?.[0] ?? "").slice(0, 200),
      confidence: 0.55,
      origin: "inferred",
    };
  }

  const round = firstMatch(text, /\b(round\s*\d+|first round|second round|final round|technical screen(?:ing)?|hiring manager (?:round|interview))\b/i);
  if (round) {
    fields.roundName = { value: round.value, evidence: round.evidence, confidence: 0.55, origin: "explicit" };
  }

  const years = firstMatch(text, /(\d{1,2})\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/i);
  if (years) {
    fields.experienceYears = {
      value: Number(years.value),
      evidence: years.evidence,
      confidence: 0.6,
      origin: "explicit",
    };
  }

  const companyFromSender = sender?.match(/@([a-z0-9-]+)\.[a-z.]+/i)?.[1];
  if (companyFromSender && !/gmail|outlook|yahoo|hotmail|icloud/i.test(companyFromSender)) {
    fields.company = {
      value: companyFromSender.charAt(0).toUpperCase() + companyFromSender.slice(1),
      evidence: sender ?? "",
      confidence: 0.35,
      origin: "inferred",
    };
  }

  const skills = KNOWN_SKILLS.filter((skill) => new RegExp(`\\b${skill.replace(/ /g, "\\s")}\\b`, "i").test(text));
  if (skills.length > 0) {
    fields.requiredSkills = {
      value: Array.from(new Set(skills)).slice(0, 20),
      evidence: "Skills named in the invitation",
      confidence: 0.5,
      origin: "explicit",
    };
  }

  return fields;
}

/**
 * InterviewEmailService — extraction and storage of imported invitations.
 *
 * Imported content is untrusted: it is sanitised, wrapped as data, and only
 * ever used to fill fields the user reviews before saving.
 */
export class InterviewEmailService {
  async extract(
    input: { content: string; subject?: string | null; sender?: string | null; sourceType: string },
  ): Promise<ExtractionResponse> {
    const sanitized = sanitizeUntrustedText(input.content, MAX_EMAIL_CHARS);
    const deterministic = deterministicExtraction(sanitized.text, input.sender);

    let aiFields: Record<string, ExtractedFieldValue> = {};
    let notes: string[] = [];

    try {
      const service = getAIService();
      const result: ExtractionResult = await service.interviewExtract({
        content: wrapUntrusted(sanitized.text),
        subject: input.subject ?? null,
        sender: input.sender ?? null,
      });
      aiFields = result.fields;
      notes = result.notes;
    } catch (err) {
      // The review screen still works with deterministic hints; the user is told
      // the AI pass was unavailable rather than shown fabricated values.
      console.error("[interview-email] AI extraction unavailable", err);
      notes = [
        "AI extraction is unavailable right now, so only the details found directly in the text are shown. Review every field.",
      ];
    }

    const fields: Record<string, ExtractedFieldValue> = {};
    for (const key of EXTRACTION_FIELDS) {
      const ai = aiFields[key];
      const local = deterministic[key];
      if (ai && ai.value !== null && ai.value !== undefined && String(ai.value).trim() !== "") {
        fields[key] = ai;
      } else if (local) {
        fields[key] = local;
      } else {
        fields[key] = { ...EMPTY_FIELD };
      }
    }

    return {
      fields,
      notes,
      suspicious: sanitized.suspicious,
      truncated: sanitized.removed > 0,
      sourceType: input.sourceType,
    };
  }

  async attach(
    professionalIdentityId: string,
    input: {
      interviewProfileId: string;
      content: string;
      subject?: string | null;
      sender?: string | null;
      sourceType: string;
      extractedFields?: unknown;
    },
  ): Promise<{ id: string }> {
    const profile = await prisma.interviewProfile.findFirst({
      where: { id: input.interviewProfileId, professionalIdentityId },
      select: { id: true },
    });
    if (!profile) throw new InterviewNotFoundError("Interview profile not found.");

    const sanitized = sanitizeUntrustedText(input.content, MAX_EMAIL_CHARS);

    const email = await prisma.interviewEmail.create({
      data: {
        interviewProfileId: profile.id,
        sourceType: input.sourceType,
        subject: input.subject ?? null,
        sender: input.sender ?? null,
        originalContent: sanitized.text,
        extractedFields: (input.extractedFields ?? null) as never,
      },
    });

    return { id: email.id };
  }
}

export const interviewEmailService = new InterviewEmailService();
