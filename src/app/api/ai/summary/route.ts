import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { AIError } from "@/lib/ai/types";
import { buildSummaryPrompt } from "@/lib/ai/prompts";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 100 * 1024;
const VALID_TONES = new Set(["professional", "technical", "creative", "academic"]);

type SummaryTone = "professional" | "technical" | "creative" | "academic";

function isValidResume(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-your-actual-openai-api-key-here" || apiKey === "your_api_key_here") {
    console.error(
      "\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "  ⚠️  OPENAI_API_KEY is not configured\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      "\n" +
      "  All AI features will fail until you add a valid OpenAI API key.\n" +
      "\n" +
      "  To fix:\n" +
      "  1. Get an API key from: https://platform.openai.com/api-keys\n" +
      "  2. Add it to your .env file:\n" +
      "     OPENAI_API_KEY=sk-your-actual-key-here\n" +
      "  3. Restart the development server\n" +
      "\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    );
    throw new AIError(
      "OPENAI_API_KEY is not configured. Add your OpenAI API key to the .env file and restart the server.",
      "MISSING_API_KEY",
      { status: 503 }
    );
  }
  const opts: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
  if (process.env.OPENAI_BASE_URL) opts.baseURL = process.env.OPENAI_BASE_URL;
  if (process.env.OPENAI_ORGANIZATION) opts.organization = process.env.OPENAI_ORGANIZATION;
  return new OpenAI(opts);
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

  // 4. Validate fields
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

  // 5. Build prompt
  const { system, user } = buildSummaryPrompt(payload.resume, tone, jobDescription);

  // 6. Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE events
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      let client: OpenAI;
      try {
        client = getOpenAIClient();
      } catch (err) {
        const msg = err instanceof AIError ? err.message : "AI service unavailable.";
        send("error", JSON.stringify({ error: msg }));
        controller.close();
        return;
      }

      try {
        const openaiStream = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user",   content: user },
          ],
          temperature: 0.8,
          max_tokens: 512,
          stream: true,
        });

        // Abort if the client disconnects mid-stream
        req.signal.addEventListener("abort", () => {
          openaiStream.controller.abort();
          controller.close();
        });

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            send("chunk", JSON.stringify({ text: delta }));
          }
          if (chunk.choices[0]?.finish_reason) {
            send("done", JSON.stringify({ finishReason: chunk.choices[0].finish_reason }));
          }
        }
      } catch (err: unknown) {
        // Don't send error on client-side abort
        if (
          err instanceof Error &&
          (err.name === "AbortError" || err.message.includes("aborted"))
        ) {
          controller.close();
          return;
        }

        const e = err as { status?: number; code?: string; message?: string } | null;
        let message = "The AI service encountered an error. Please try again.";
        if (e?.status === 401)  message = "Invalid API key.";
        if (e?.status === 429)  message = "Rate limit exceeded. Please wait and try again.";
        if (e?.status && e.status >= 500) message = "AI provider unavailable. Please try again.";

        send("error", JSON.stringify({ error: message }));
        console.error("[POST /api/ai/summary]", err);
      } finally {
        controller.close();
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
