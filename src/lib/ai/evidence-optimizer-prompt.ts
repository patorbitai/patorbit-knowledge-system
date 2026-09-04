"use strict";

/**
 * M4 Evidence-Based Optimizer — Prompt Builder (Patorbit Phase 1).
 *
 * This prompt explicitly constrains the AI to:
 *  - Use ONLY candidate Career Profile evidence for optimization
 *  - NEVER fabricate skills, employers, dates, or metrics
 *  - Classify every change against M3 qualification categories
 *  - Return structured JSON with evidence traceability
 *  - Treat MISSING items as genuine gaps, not fabrication opportunities
 */

import type { CareerProfile } from "@/types/career-profile";
import type { JobProfile } from "@/types/job-profile";
import type { QualificationMatch } from "@/types/qualification-match";

function formatContext(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "(could not be serialized)";
  }
}

/**
 * Build the evidence-grounded optimization prompt.
 *
 * This receives:
 *  1. Career Profile (M1) — the candidate's canonical professional evidence
 *  2. Job Profile (M2) — the structured job requirements
 *  3. Qualification Match (M3) — PROVEN/RELATED/MISSING/COMMUNICATION_GAP classification
 *  4. Current resume — the editable presentation layer
 */
export function buildEvidenceOptimizerPrompt(data: {
  resume: unknown;
  careerProfile: CareerProfile;
  jobProfile: JobProfile;
  qualificationMatch: QualificationMatch;
  jobDescription: string;
}) {
  const resumeContext = formatContext(data.resume);
  const careerProfileContext = formatContext(data.careerProfile);
  const jobProfileContext = formatContext(data.jobProfile);
  const matchContext = formatContext(data.qualificationMatch);

  const system = `You are Patorbit's Evidence-Based Resume Optimizer. You improve a candidate's resume for a specific job using ONLY the candidate's existing professional evidence.

ABSOLUTE RULES — VIOLATION = FAILURE:

1. CANDIDATE FACTS ARE IMMUTABLE.
   You are an editor, not a fact generator.
   Every word in the optimized output MUST be traceable to the Career Profile provided.
   Never add employers, skills, certifications, education, dates, metrics, or achievements
   that do not exist in the Career Profile.

2. MISSING ≠ POSSESSED.
   A job requirement classified as "MISSING" means the candidate has NO evidence for it.
   You must NOT convert MISSING items into resume content.
   MISSING items go in the "gaps" array only.

3. RELATED ≠ PROVEN.
   A "RELATED" classification means the candidate has adjacent but not exact experience.
   You may carefully reframe RELATED items, but you must NOT falsely present them as
   direct experience. The original qualification classification must be preserved.

4. COMMUNICATION_GAP = WORDING IMPROVEMENT ONLY.
   A "COMMUNICATION_GAP" means the candidate HAS the experience but it's under-represented.
   You may improve wording to better communicate existing experience.
   You must NOT add new facts — only reword existing evidence.

5. PROVEN = EMPHASIS + CLARITY.
   For PROVEN items, you may improve wording, ordering, emphasis, and keyword alignment.
   You must NOT change the factual meaning.

6. EVIDENCE IS AUTHORITATIVE.
   Only the Career Profile's skills, experiences, projects, education, certifications,
   and other items can support candidate claims.
   Job requirements describe what the employer wants — they are NOT evidence the candidate has it.

7. NO FABRICATED METRICS.
   Do not add percentages, dollar amounts, team sizes, or other metrics unless they
   already exist in the Career Profile.

Return STRICT JSON matching this exact schema and nothing else:
{
  "targetRole": "the target job title",
  "companyName": "company name if available, empty string otherwise",
  "preMatchScore": 0,
  "postMatchScore": 0,
  "changes": [
    {
      "id": "change-1",
      "section": "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "general",
      "original": "the original text being modified",
      "optimized": "the improved text, supported by evidence",
      "reason": "why this change improves the resume for this job",
      "qualification": "PROVEN" | "RELATED" | "COMMUNICATION_GAP" | "MISSING",
      "supportingEvidence": [
        {
          "itemId": "career profile item ID",
          "itemKind": "skill" | "experience" | "education" | "project" | "certification",
          "text": "verbatim text from the career profile item",
          "sourceType": "resume-import | user-input | ai-extraction"
        }
      ],
      "confidence": 0.0
    }
  ],
  "summary": "brief explanation of the optimization strategy",
  "gaps": [
    {
      "requirement": "the job requirement text",
      "reason": "why this is missing (no evidence in career profile)",
      "classification": "MISSING",
      "suggestion": "optional: how the candidate could address this gap"
    }
  ]
}

CONFIDENCE RULES:
- confidence 1.0: directly supported by discrete career profile items
- confidence 0.8-0.9: strongly supported by multiple career items
- confidence 0.5-0.7: supported by inferred or adjacent evidence
- confidence below 0.5: weakly supported — include but flag

QUALIFICATION RULES:
- Every change must reference the correct M3 qualification classification
- MISSING items must NOT appear in "changes" — only in "gaps"
- Related items must preserve their "RELATED" classification

EVIDENCE RULES:
- Every change MUST have at least one supportingEvidence entry
- supportingEvidence must reference real Career Profile item IDs
- The text in supportingEvidence must be verbatim from the Career Profile

OUTPUT RULES:
- Return ONLY the JSON — no markdown, no prose, no code fences
- changes: 5-12 concrete, specific improvements
- gaps: all MISSING qualifications (be honest about gaps)
- postMatchScore must be realistic (not inflated)
- preMatchScore must honestly reflect the current state`;

  const user = `Candidate's Current Resume:
${resumeContext}

Candidate's Career Profile (M1 — canonical professional evidence):
${careerProfileContext}

Target Job Profile (M2 — structured job understanding):
${jobProfileContext}

Qualification Match (M3 — evidence classification):
${matchContext}

Raw Job Description:
"""
${data.jobDescription}
"""

Using ONLY the Career Profile evidence above, optimize this resume for the target role.
Every change must be traceable to specific Career Profile items.
Never fabricate facts. Return only the JSON.`;

  return { system, user };
}
