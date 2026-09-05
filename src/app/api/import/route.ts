import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkImportRateLimit } from "@/lib/rate-limit";
import mammoth from "mammoth";
import { parseResumeJson } from "@/utils/resume-schema";
import { rawToResume, withIds } from "@/utils/resume-parser";
import { ensureItemIds } from "@/utils/import-json";
import { mapEvidenceToResume } from "@/utils/evidence-resume-mapper";
import { getAIService } from "@/lib/ai/service";
import { extractPageText, type PdfTextItem } from "@/utils/pdf-extract";
import { buildDocumentRecord } from "@/lib/document-model";
import { extractEvidenceFacts } from "@/lib/document-model/evidence";
import type { EvidenceFact } from "@/lib/document-model/evidence";
import "@/utils/pdfjs-polyfill";

/** Maximum file size for imports (10 MB). */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Deterministic-first import rule (PATORBIT CORE RULE — NO AI FOR IMPORT).
 *
 * Normal uploads must parse deterministically and never consume LLM tokens:
 * PDF/DOCX → text extraction → deterministic parsing → validation. AI is an
 * OPTIONAL last-resort fallback used ONLY when the deterministic parser could
 * not confidently classify the document (very low structured coverage). When
 * AI is used it only fills fields deterministic code left empty — it never
 * overwrites source evidence or invents missing information, and any failure
 * (missing key, timeout, rate limit, zero tokens) returns the deterministic
 * result unchanged so Patorbit stays fully functional without AI.
 */

/** Minimum structured signals required to skip the AI fallback entirely. */
const CONFIDENT_SIGNALS = 2;

/** Kill switch: set IMPORT_AI_FALLBACK=0/false to disable AI for imports. */
function aiFallbackEnabled(): boolean {
  const v = process.env.IMPORT_AI_FALLBACK;
  return v === undefined || (v !== "0" && v.toLowerCase() !== "false");
}

/** Count how much real structure the deterministic parser recovered. */
function deterministicSignals(resume: Record<string, unknown>): number {
  let signals = 0;
  if (resume.name) signals += 1;
  if (resume.email || resume.phone) signals += 1;
  if (Array.isArray(resume.experience) && resume.experience.length) signals += 1;
  if (Array.isArray(resume.education) && resume.education.length) signals += 1;
  if (Array.isArray(resume.skills) && resume.skills.length) signals += 1;
  if (resume.summary) signals += 1;
  return signals;
}

/** True when a value is empty (missing, "", or an empty array). */
function isEmptyValue(v: unknown): boolean {
  return (
    v === undefined ||
    v === null ||
    v === "" ||
    (Array.isArray(v) && v.length === 0)
  );
}

/**
 * Merge AI output into the deterministic result WITHOUT overwriting source
 * evidence. For every field, a non-empty deterministic value always wins; AI
 * only fills gaps. Nested `social` is merged per-key the same way.
 */
function mergeResume(base: Record<string, unknown>, ai: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(ai)]);
  for (const key of keys) {
    const bv = base[key];
    const av = ai[key];
    if (key === "social" && bv && typeof bv === "object") {
      out.social = {
        ...(av && typeof av === "object" ? (av as Record<string, unknown>) : {}),
        ...(bv as Record<string, unknown>),
      };
    } else if (!isEmptyValue(bv)) {
      out[key] = bv;
    } else if (!isEmptyValue(av)) {
      out[key] = av;
    } else {
      out[key] = bv ?? av;
    }
  }
  return out;
}

/**
 * Build the DocumentRecord + EvidenceFacts for the extracted page texts.
 * Uses ONLY the existing deterministic Document Model; adds no new rules and
 * never replaces the Resume produced by rawToResume. Returns null when there
 * is no text to model (e.g. JSON imports).
 */
function buildDocumentEvidence(
  pageTexts: string[],
  opts: { sourceType: "pdf" | "docx"; fileName?: string },
): { facts: EvidenceFact[]; id: string; blocks: number; lines: number } | null {
  if (pageTexts.length === 0 || pageTexts.every((t) => !t.trim())) return null;
  const record = buildDocumentRecord(pageTexts, {
    sourceType: opts.sourceType,
    ...(opts.fileName ? { fileName: opts.fileName } : {}),
  });
  return {
    facts: extractEvidenceFacts(record.blocks),
    id: record.id,
    blocks: record.blocks.length,
    lines: record.lines.length,
  };
}

/**
 * Resolve extracted text into a resume: deterministic first, AI as an
 * optional last-resort gap-filler only when deterministic coverage is low and
 * the fallback is enabled. Never throws — always returns a usable resume.
 */
async function resolveTextImport(rawText: string): Promise<{ data: Record<string, unknown>; usedAI: boolean }> {
  const deterministic = rawToResume(rawText);
  const signals = deterministicSignals(deterministic);

  if (signals >= CONFIDENT_SIGNALS || !aiFallbackEnabled()) {
    return { data: deterministic, usedAI: false };
  }

  const aiResult = await extractWithAI(rawText);
  if (!aiResult) return { data: deterministic, usedAI: false };

  return { data: mergeResume(deterministic, aiResult), usedAI: true };
}

/**
 * Try AI extraction as a last resort. If AI fails for any reason (missing
 * key, timeout, bad JSON, rate limit), return null so the deterministic
 * result is used. AI output lacks `id` fields — `withIds` is applied here
 * before Zod sees it.
 */
async function extractWithAI(rawText: string): Promise<Record<string, unknown> | null> {
  try {
    const ai = getAIService();
    const raw = await ai.extractResume({ rawText });
    // Ensure every array field has sequential ids for Zod validation
    const arrFields = ["experience", "education", "skills", "projects", "certifications", "languages", "interests", "achievements", "references"] as const;
    for (const field of arrFields) {
      if (Array.isArray(raw[field])) {
        raw[field] = withIds(raw[field] as object[]);
      } else {
        raw[field] = [];
      }
    }
    // No templateId here: imported files carry no template choice, so the
    // apply step preserves the user's current template. The schema default
    // ("template-1", not a real template) marks "unspecified".
    return raw;
  } catch {
    return null; // signal caller to keep the deterministic result
  }
}

export async function POST(request: NextRequest) {
  try {
    // 0. Authentication — required to import a resume
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // 0a. Rate limit — import can trigger AI extraction
    const { allowed, retryAfter } = checkImportRateLimit(session.user.id);
    if (!allowed) {
      const r429 = NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 },
      );
      r429.headers.set("Retry-After", String(retryAfter));
      return r429;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (file && file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 10 MB." },
        { status: 413 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Please select a file to import." },
        { status: 400 }
      );
    }

    const fileType = file.type;
    let parsedData: Record<string, unknown> = {};
    let usedAI = false;
    let charCount = 0;
    let rawTextForMeta = "";
    // Per-page extracted text, used by buildDocumentRecord so page provenance
    // survives into the EvidenceFacts (parallel, additive — never replaces
    // the Resume built by rawToResume in this slice).
    let documentEvidence: { facts: EvidenceFact[]; id: string; blocks: number; lines: number } | null = null;
    // Matches the cap in src/lib/ai/prompts.ts extractResume()
    const PROMPT_CAP = 24000;

    if (fileType === "application/json") {
      const text = await file.text();
      parsedData = ensureItemIds(JSON.parse(text));
      usedAI = false;
    } else if (fileType === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
      (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(arrayBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      const doc = await loadingTask.promise;
      const diagnostics: { page: number; items: number; chars: number }[] = [];
      const pageTexts: string[] = [];
      let fullText = "";
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = (await page.getTextContent({ includeMarkedContent: false })) as unknown as {
          items: PdfTextItem[];
        };
        const pageText = extractPageText(content.items as PdfTextItem[]);
        pageTexts.push(pageText);
        fullText += pageText;
        diagnostics.push({ page: i, items: content.items.length, chars: fullText.length });
        page.cleanup();
      }
      if (fullText.trim().length < 50) {
        return NextResponse.json(
          {
            error: "PDF appears to be image-based (scanned). Text could not be extracted. Please use a text-based PDF or DOCX.",
            diagnostics,
          },
          { status: 422 }
        );
      }
      charCount = fullText.length;
      rawTextForMeta = fullText.slice(0, 6000);
      const pdfResolved = await resolveTextImport(fullText);
      usedAI = pdfResolved.usedAI;
      parsedData = pdfResolved.data;
      documentEvidence = buildDocumentEvidence(pageTexts, {
        sourceType: "pdf",
        fileName: file.name,
      });
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: arrayBuffer as unknown as Buffer });
      charCount = result.value.length;
      rawTextForMeta = result.value.slice(0, 6000);
      const docxResolved = await resolveTextImport(result.value);
      usedAI = docxResolved.usedAI;
      parsedData = docxResolved.data;
      documentEvidence = buildDocumentEvidence([result.value], {
        sourceType: "docx",
        fileName: file.name,
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a JSON, PDF, or DOCX file." },
        { status: 400 }
      );
    }

    // Deterministic evidence wins for the fields it can prove. This overlay is
    // a separate, parallel step from rawToResume: it only touches name, email,
    // phone, social links, skills and experience; every other field keeps
    // whatever the resolver produced. Recording what changed lets the UI trust
    // the result, and `uncertain` counts evidence that grouping could not
    // confidently assign (preserved for review, never guessed).
    let evidenceOverlay: { used: boolean; changed: string[]; uncertain: number } = {
      used: false,
      changed: [],
      uncertain: 0,
    };
    if (documentEvidence) {
      const { resume: overlaid, changed, uncertain } = mapEvidenceToResume(
        parsedData,
        documentEvidence.facts,
      );
      parsedData = overlaid;
      evidenceOverlay = { used: true, changed, uncertain: uncertain.length };
    }

    const finalData = parseResumeJson(parsedData);

    return NextResponse.json({
      resume: finalData,
      meta: {
        path: usedAI ? "ai" : "regex",
        truncated: charCount > PROMPT_CAP,
        charCount,
        rawText: rawTextForMeta,
        evidenceOverlay,
      },
      ...(documentEvidence
        ? {
            document: {
              recordId: documentEvidence.id,
              blocks: documentEvidence.blocks,
              lines: documentEvidence.lines,
            },
            evidence: documentEvidence.facts,
          }
        : {}),
    });
  } catch (error) {
    console.error("[import] error:", error);
    return NextResponse.json(
      { error: "Failed to import the file. Please try a different file." },
      { status: 500 }
    );
  }
}