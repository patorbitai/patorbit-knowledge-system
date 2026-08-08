import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { getAIProvider } from "@/lib/ai/provider";
import { AIError } from "@/lib/ai/types";
import type { BulletSuggestion, AIChatMessage } from "@/lib/ai/types";
import { buildBulletsPrompt } from "@/lib/ai/prompts";
import type { Resume } from "@/types/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 100 * 1024;
const TIMEOUT_MS = 55_000;

// ── Validation ────────────────────────────────────────────────────────────────

function isValidResume(value: unknown): value is Resume {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateBulletsShape(raw: unknown, entryId: string): BulletSuggestion[] {
  if (!Array.isArray(raw)) {
    throw new AIError("AI returned an unexpected response format.", "UPSTREAM", { status: 502 });
  }

  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .filter((item) =>
      typeof item.bulletIndex === "number" &&
      typeof item.original === "string" &&
      typeof item.improved === "string" &&
      typeof item.reasoning === "string" &&
      item.original.trim().length > 0 &&
      item.improved.trim().length > 0,
    )
    .map((item) => ({
      entryId,
      bulletIndex: item.bulletIndex as number,
      original:   (item.original  as string).trim(),
      improved:   (item.improved  as string).trim(),
      reasoning:  (item.reasoning as string).trim(),
    }));
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
  if (typeof payload.entryId !== "string" || payload.entryId.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing required field: entryId." },
      { status: 400 },
    );
  }

  const resume = payload.resume as Resume;
  const entryId = payload.entryId.trim();
  const context =
    typeof payload.context === "string" && payload.context.trim().length > 0
      ? payload.context.trim()
      : undefined;

  // 5. Locate the experience entry
  const entry = resume.experience?.find((e) => e.id === entryId);
  if (!entry) {
    return NextResponse.json(
      { success: false, error: `Experience entry "${entryId}" not found.` },
      { status: 404 },
    );
  }

  // 6. Short-circuit: nothing to improve
  if (!entry.bulletPoints || entry.bulletPoints.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  // 7. Build prompt + call AI
  try {
    const { system, user } = buildBulletsPrompt(entry, context);

    const messages: AIChatMessage[] = [
      { role: "system", content: system },
      { role: "user",   content: user },
    ];

    const provider = getAIProvider();
    const result = await withTimeout(
      provider.complete(messages, { maxTokens: 1024, jsonMode: true }),
    );

    // 8. Parse + validate
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

    const suggestions = validateBulletsShape(parsed, entryId);
    return NextResponse.json({ success: true, data: suggestions });

  } catch (err) {
    if (err instanceof AIError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status },
      );
    }

    console.error("[POST /api/ai/bullets]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong while improving bullets." },
      { status: 500 },
    );
  }
}
