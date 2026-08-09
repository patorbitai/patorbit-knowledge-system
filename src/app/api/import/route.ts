import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkImportRateLimit } from "@/lib/rate-limit";
import mammoth from "mammoth";
import { parseResumeJson } from "@/utils/resume-schema";
import { rawToResume, withIds } from "@/utils/resume-parser";
import { getAIService } from "@/lib/ai/service";
import { extractPageText, type PdfTextItem } from "@/utils/pdf-extract";

/** Maximum file size for imports (10 MB). */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Try AI extraction first. If AI fails for any reason (missing key, timeout,
 * bad JSON), fall back to the regex parser so the import always returns
 * something rather than a blank error.
 *
 * AI output lacks `id` fields — `withIds` is applied here before Zod sees it.
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
    // Preserve templateId default
    if (!raw.templateId) raw.templateId = "modern-clean";
    return raw;
  } catch {
    return null; // signal caller to fall back to regex
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
    let parsedData: any;
    let usedAI = false;
    let charCount = 0;
    let rawTextForMeta = "";
    // Matches the cap in src/lib/ai/prompts.ts extractResume()
    const PROMPT_CAP = 24000;

    if (fileType === "application/json") {
      const text = await file.text();
      parsedData = JSON.parse(text);
      usedAI = false;
    } else if (fileType === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(arrayBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
      const doc = await loadingTask.promise;
      const diagnostics: { page: number; items: number; chars: number }[] = [];
      let fullText = "";
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent({ includeMarkedContent: false } as any);
        fullText += extractPageText(content.items as PdfTextItem[]);
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
      const aiResult = await extractWithAI(fullText);
      usedAI = aiResult !== null;
      parsedData = aiResult ?? rawToResume(fullText);
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: arrayBuffer as any });
      charCount = result.value.length;
      rawTextForMeta = result.value.slice(0, 6000);
      const aiResult = await extractWithAI(result.value);
      usedAI = aiResult !== null;
      parsedData = aiResult ?? rawToResume(result.value);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a JSON, PDF, or DOCX file." },
        { status: 400 }
      );
    }

    const validatedData = parseResumeJson(parsedData);

    return NextResponse.json({
      resume: validatedData,
      meta: {
        path: usedAI ? "ai" : "regex",
        truncated: charCount > PROMPT_CAP,
        charCount,
        rawText: rawTextForMeta,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import the file" },
      { status: 500 }
    );
  }
}