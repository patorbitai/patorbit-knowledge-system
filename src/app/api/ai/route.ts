import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIService, type AIAction } from "@/lib/ai/service";
import { AIError } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Known AI actions for dispatch. */
const KNOWN_ACTIONS: readonly string[] = [
  "generateSummary",
  "rewrite",
  "improveTone",
  "atsOptimization",
  "improveBulletPoints",
  "generateProjects",
  "suggestSkills",
  "analyzeResume",
  "generateAchievements",
  "interviewPreparation",
  "analyzeJobMatch",
  "optimizeForJob",
  "generateClaims",
  "tailorResume",
];

/** Maximum request body size (100 KB). */
const MAX_BODY_BYTES = 100 * 1024;

/** In-memory rate limiting per IP. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    rateLimitStore.set(ip, entry);
    return { ok: true };
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { ok: false, retryAfter };
  }

  return { ok: true };
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  // 0. Authentication — required for all AI actions
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Please sign in." },
      { status: 401 },
    );
  }

  // 1. Body size validation
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: "Request body too large." },
      { status: 413 },
    );
  }

  // 2. Rate limiting
  const ip = clientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Please wait before trying again.",
        retryAfter: limit.retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  // 3. Parse + validate request
  let body: unknown;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  const payload = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const action = typeof payload.action === "string" ? payload.action : "";
  const data = (payload.data ?? {}) as Record<string, unknown>;

  if (!action) {
    return NextResponse.json(
      { success: false, error: "Missing required field: action." },
      { status: 400 },
    );
  }

  if (!KNOWN_ACTIONS.includes(action)) {
    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}.` },
      { status: 400 },
    );
  }

  // 4. Dispatch to AI service with timeout protection
  try {
    const service = getAIService();
    const result = await withTimeout(service.dispatch(action as AIAction, data));
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return handleError(err);
  }
}

/** Wrap AI call in a hard timeout. */
async function withTimeout<T>(promise: Promise<T>): Promise<T> {
  const timeoutMs = 55_000;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AIError("The AI request timed out. Please try again.", "TIMEOUT", {
      status: 408,
      userFacing: true,
    })), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Convert any thrown value to a structured error response. */
function handleError(err: unknown): NextResponse {
  if (err instanceof AIError) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: err.status },
    );
  }

  // Log and return generic error for unexpected issues
  console.error("[API /ai] Unexpected error:", err);
  return NextResponse.json(
    { success: false, error: "Something went wrong while processing the AI request." },
    { status: 500 },
  );
}