import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkImportRateLimit } from "@/lib/rate-limit";
import mammoth from "mammoth";
import { parseResumeJson } from "@/utils/resume-schema";
import { rawToResume, withIds } from "@/utils/resume-parser";
import { getAIService } from "@/lib/ai/service";

/** Maximum file size for imports (10 MB). */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface PdfTextItem {
  str: string;
  transform: number[]; // [scaleX, skewX, skewY, scaleY, x, y]
  width: number;
  height: number;
  hasEOL?: boolean;
}

/**
 * Reconstruct readable lines from pdfjs text items.
 *
 * pdfjs returns items in paint order — not reading order. We group items by Y
 * coordinate (±2pt), then within each Y bucket detect whether items belong to
 * separate columns by looking for a significant X gap (>150pt). When two column
 * clusters exist we emit left column items first, then right column items — so
 * a two-column resume is read left-column top-to-bottom, then right-column
 * top-to-bottom, rather than interleaving both columns line-by-line.
 */
function extractPageText(items: PdfTextItem[]): string {
  if (!items.length) return "";

  const Y_TOLERANCE = 2;
  const COLUMN_GAP_THRESHOLD = 150; // pt; gap between left and right column clusters

  const rows = new Map<number, { x: number; str: string }[]>();

  for (const item of items) {
    if (!item.str.trim() && !item.hasEOL) continue;
    const rawY = item.transform[5];
    const bucketY = Math.round(rawY / Y_TOLERANCE) * Y_TOLERANCE;
    if (!rows.has(bucketY)) rows.set(bucketY, []);
    rows.get(bucketY)!.push({ x: item.transform[4], str: item.str });
  }

  // Detect whether this page is two-column: find largest X gap across all rows.
  // If that gap exceeds COLUMN_GAP_THRESHOLD we split into left/right columns.
  let maxGap = 0;
  let splitX = 0;
  for (const rowItems of rows.values()) {
    const xs = rowItems.map(i => i.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) {
      const gap = xs[i] - xs[i - 1];
      if (gap > maxGap) { maxGap = gap; splitX = (xs[i - 1] + xs[i]) / 2; }
    }
  }
  const isTwoColumn = maxGap > COLUMN_GAP_THRESHOLD;

  // Sort Y descending (PDF Y increases upward)
  const sortedYs = [...rows.keys()].sort((a, b) => b - a);

  if (!isTwoColumn) {
    const lines: string[] = [];
    for (const y of sortedYs) {
      const lineItems = rows.get(y)!.sort((a, b) => a.x - b.x);
      const lineText = lineItems.map(i => i.str).join(" ").trim();
      if (lineText) lines.push(lineText);
    }
    return lines.join("\n") + "\n\n";
  }

  // Two-column: accumulate left and right column lines independently, then
  // emit left column first so section boundaries are not interleaved.
  const leftLines: string[] = [];
  const rightLines: string[] = [];

  for (const y of sortedYs) {
    const rowItems = rows.get(y)!.sort((a, b) => a.x - b.x);
    const left = rowItems.filter(i => i.x < splitX).map(i => i.str).join(" ").trim();
    const right = rowItems.filter(i => i.x >= splitX).map(i => i.str).join(" ").trim();
    if (left) leftLines.push(left);
    if (right) rightLines.push(right);
  }

  return leftLines.join("\n") + "\n\n" + rightLines.join("\n") + "\n\n";
}

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