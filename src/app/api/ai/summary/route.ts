import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { AIError } from "@/lib/ai/types";
import { getAIProvider } from "@/lib/ai/provider";
import { buildSummaryPrompt } from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 100 * 1024;
const VALID_TONES = new Set(["professional", "technical", "creative", "academic"]);

type SummaryTone = "professional" | "technical" | "creative" | "academic";

function isValidResume(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(req: NextRequest): Promise<NextResponse | Response> {
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

  // 4. Parse body
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

  // 5. Validate fields
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

  const rawTone = payload.tone;
  if (rawTone !== undefined && !VALID_TONES.has(String(rawTone))) {
    return NextResponse.json(
      { success: false, error: `Invalid tone. Must be one of: ${[...VALID_TONES].join(", ")}.` },
      { status: 400 },
    );
  }

  const tone = (rawTone as SummaryTone | undefined) ?? "professional";
  const jobDescription =
    typeof payload.jobDescription === "string" && payload.jobDescription.trim().length > 0
      ? payload.jobDescription.trim()
      : undefined;

  // 6. Build prompt
  const { system, user } = buildSummaryPrompt(payload.resume, tone, jobDescription);

  // 7. Create SSE stream using the configured AI provider
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE events — EXACT same format the frontend expects
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      let provider;
      try {
        provider = getAIProvider();
      } catch (err) {
        const msg = err instanceof AIError ? err.message : "AI service unavailable.";
        send("error", JSON.stringify({ error: msg }));
        controller.close();
        return;
      }

      // If provider supports streaming, use it
      if (provider.completeStream) {
        try {
          const messages = [
            { role: "system" as const, content: system },
            { role: "user" as const, content: user },
          ];

          for await (const chunk of provider.completeStream(messages, {
            temperature: 0.8,
            maxTokens: 512,
          })) {
            // Abort if the client disconnects
            if (req.signal.aborted) break;
            send("chunk", JSON.stringify({ text: chunk }));
          }

          send("done", JSON.stringify({ finishReason: "stop" }));
        } catch (err: unknown) {
          if (
            err instanceof Error &&
            (err.name === "AbortError" || err.message.includes("aborted"))
          ) {
            controller.close();
            return;
          }

          const e = err as { status?: number; code?: string; message?: string } | null;
          let message = "The AI service encountered an error. Please try again.";
          if (e?.code === "MISSING_API_KEY") message = "AI API key is not configured.";
          if (e?.status === 401) message = "Invalid API key.";
          if (e?.status === 429) message = "Rate limit exceeded. Please wait and try again.";
          if (e?.status && e.status >= 500) message = "AI provider unavailable. Please try again.";

          send("error", JSON.stringify({ error: message }));
          console.error("[POST /api/ai/summary]", err);
        } finally {
          controller.close();
        }
      } else {
        // Fallback: use non-streaming complete() and send result as a single chunk
        try {
          const messages = [
            { role: "system" as const, content: system },
            { role: "user" as const, content: user },
          ];

          const result = await provider.complete(messages, {
            temperature: 0.8,
            maxTokens: 512,
          });

          send("chunk", JSON.stringify({ text: result.content }));
          send("done", JSON.stringify({ finishReason: "stop" }));
        } catch (err: unknown) {
          const e = err as { status?: number; code?: string; message?: string } | null;
          let message = "The AI service encountered an error. Please try again.";
          if (e?.code === "MISSING_API_KEY") message = "AI API key is not configured.";
          if (e?.status === 401) message = "Invalid API key.";
          if (e?.status === 429) message = "Rate limit exceeded. Please wait and try again.";

          send("error", JSON.stringify({ error: message }));
          console.error("[POST /api/ai/summary]", err);
        } finally {
          controller.close();
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // disable proxy buffering (nginx)
    },
  });
}
