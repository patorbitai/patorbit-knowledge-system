import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { usageService } from "@/services/usage.service";
import { getAIProvider } from "@/lib/ai/provider";
import { AIError } from "@/lib/ai/types";
import type { ResumeScore, ScoreSuggestion } from "@/lib/ai/types";
import { buildScorePrompt } from "@/lib/ai/prompts";
import type { AIChatMessage } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 100 * 1024;
const TIMEOUT_MS = 55_000;

// ── Validation helpers ────────────────────────────────────────────────────────

const VALID_SECTIONS = new Set(["experience", "summary", "skills", "education", "general"]);
const VALID_PRIORITIES = new Set(["high", "medium", "low"]);

function isValidResume(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateScoreShape(raw: unknown): ResumeScore {
  if (typeof raw !== "object" || raw === null) {
    throw new AIError("AI returned an unexpected response format.", "UPSTREAM", { status: 502 });
  }

  const obj = raw as Record<string, unknown>;

  const overall = typeof obj.overall === "number" ? Math.round(Math.max(0, Math.min(100, obj.overall))) : 0;

  const bd = (typeof obj.breakdown === "object" && obj.breakdown !== null)
    ? obj.breakdown as Record<string, unknown>
    : {};

  const clamp = (v: unknown) => typeof v === "number" ? Math.round(Math.max(0, Math.min(100, v))) : 0;

  const breakdown = {
    impact:       clamp(bd.impact),
    clarity:      clamp(bd.clarity),
    completeness: clamp(bd.completeness),
    ats:          clamp(bd.ats),
    tailoring:    clamp(bd.tailoring),
  };

  const rawSuggestions = Array.isArray(obj.suggestions) ? obj.suggestions : [];
  const suggestions: ScoreSuggestion[] = rawSuggestions
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .filter((s) => VALID_SECTIONS.has(String(s.section)) && VALID_PRIORITIES.has(String(s.priority)) && typeof s.text === "string" && s.text.trim().length > 0)
    .map((s) => ({
      section:  s.section  as ScoreSuggestion["section"],
      priority: s.priority as ScoreSuggestion["priority"],
      text:     String(s.text).trim(),
    }))
    .slice(0, 8);

  return { overall, breakdown, suggestions };
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

  // 2. Rate limit & Usage metering
  const { allowed, retryAfter } = checkAIRateLimit(session.user.id);
  if (!allowed) {
    const r429 = NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
    r429.headers.set("Retry-After", String(retryAfter));
    return r429;
  }

  const usageCheck = await usageService.checkAndIncrementUsage(session.user.id, "ai_generations");
  if (!usageCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Monthly AI generation limit reached for Free tier. Upgrade to Professional for unlimited AI generations.", code: "USAGE_LIMIT_REACHED" },
      { status: 429 },
    );
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

  const jobDescription =
    typeof payload.jobDescription === "string" && payload.jobDescription.trim().length > 0
      ? payload.jobDescription.trim()
      : undefined;

  // 5. Build prompt + call AI
  try {
    const { system, user } = buildScorePrompt(payload.resume, jobDescription);

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

    const score = validateScoreShape(parsed);
    return NextResponse.json({ success: true, data: score });

  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status },
      );
    }

    console.error("[POST /api/ai/score]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong while scoring the resume." },
      { status: 500 },
    );
  }
}
