import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { getAIProvider } from "@/lib/ai/provider";
import { AIError } from "@/lib/ai/types";
import type { KeywordAnalysis, AIChatMessage } from "@/lib/ai/types";
import { buildKeywordsPrompt } from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 150 * 1024;
const TIMEOUT_MS = 55_000;
const MAX_KEYWORD_ITEMS = 20;

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidResume(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown, limit = MAX_KEYWORD_ITEMS): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, limit);
}

function toDensityMap(value: unknown, present: string[]): Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const presentSet = new Set(present);
  const result: Record<string, number> = {};
  for (const key of Object.keys(raw)) {
    if (presentSet.has(key)) {
      const count = Number(raw[key]);
      result[key] = Number.isFinite(count) && count >= 0 ? Math.round(count) : 0;
    }
  }
  return result;
}

function validateKeywordsShape(raw: unknown): KeywordAnalysis {
  if (typeof raw !== "object" || raw === null) {
    throw new AIError("AI returned an unexpected response format.", "UPSTREAM", { status: 502 });
  }

  const obj = raw as Record<string, unknown>;

  const score = typeof obj.score === "number"
    ? Math.round(Math.max(0, Math.min(100, obj.score)))
    : 0;

  const present     = toStringArray(obj.present);
  const missing     = toStringArray(obj.missing);
  const recommended = toStringArray(obj.recommended);
  const density     = toDensityMap(obj.density, present);

  return { score, present, missing, recommended, density };
}

// ── Timeout wrapper ───────────────────────────────────────────────────────────

async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new AIError("The AI request timed out. Please try again.", "TIMEOUT", { status: 408 })),
      TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Please sign in." },
      { status: 401 },
    );
  }

  // 2. Rate limit
  const { allowed, retryAfter } = checkAIRateLimit(session.user.id);
  if (!allowed) {
    const r429 = NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
    r429.headers.set("Retry-After", String(retryAfter));
    return r429;
  }

  // 3. Body size guard
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: "Request body too large." },
      { status: 413 },
    );
  }

  // 3. Parse body
  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { success: false, error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;

  // 4. Validate required fields
  if (!("resume" in payload)) {
    return NextResponse.json(
      { success: false, error: "Missing required field: resume." },
      { status: 400 },
    );
  }

  if (!isValidResume(payload.resume)) {
    return NextResponse.json(
      { success: false, error: "Invalid resume: must be a non-null object." },
      { status: 400 },
    );
  }

  // jobDescription is required for keyword analysis
  if (
    typeof payload.jobDescription !== "string" ||
    payload.jobDescription.trim().length === 0
  ) {
    return NextResponse.json(
      { success: false, error: "Missing required field: jobDescription." },
      { status: 400 },
    );
  }

  const jobDescription = payload.jobDescription.trim();

  // 5. Build prompt + call AI
  try {
    const { system, user } = buildKeywordsPrompt(payload.resume, jobDescription);

    const messages: AIChatMessage[] = [
      { role: "system", content: system },
      { role: "user",   content: user },
    ];

    const provider = getAIProvider();
    const result = await withTimeout(
      provider.complete(messages, { maxTokens: 1024, jsonMode: true }),
    );

    // 6. Parse + validate AI response
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      throw new AIError(
        "The AI returned an invalid response. Please try again.",
        "UPSTREAM",
        { status: 502 },
      );
    }

    const analysis = validateKeywordsShape(parsed);
    return NextResponse.json({ success: true, data: analysis });

  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status },
      );
    }

    console.error("[POST /api/ai/keywords]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong while analysing keywords." },
      { status: 500 },
    );
  }
}
