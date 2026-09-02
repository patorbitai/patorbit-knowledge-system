"use strict";

/**
 * Google Gemini AI Provider
 *
 * Drop-in implementation of the AIProvider interface using Google's Generative AI
 * (Gemini) API. Swapping from OpenAI to Gemini requires only:
 *
 *   AI_PROVIDER=gemini
 *   GEMINI_API_KEY=your-key
 *
 * All existing AI actions, prompts, and service-layer logic remain unchanged.
 */
import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type {
  AIProvider,
  AIProviderOptions,
  AIProviderResult,
  AIChatMessage,
} from "./types";
import { AIError } from "./types";

/** Default Gemini model — fast, free-tier eligible, supports JSON mode. */
const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  private client: GoogleGenerativeAI | null = null;
  private modelInstance: GenerativeModel | null = null;

  /** Lazily initialize the Gemini client so a missing key throws only on use. */
  private getModel(): GenerativeModel {
    if (this.modelInstance) return this.modelInstance;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(
        "\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "  ⚠️  GEMINI_API_KEY is not configured\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
        "\n" +
        "  All AI features will fail until you add a valid Gemini API key.\n" +
        "\n" +
        "  To fix:\n" +
        "  1. Get an API key from: https://aistudio.google.com/apikey\n" +
        "  2. Add it to your .env file:\n" +
        "     GEMINI_API_KEY=your-actual-key-here\n" +
        "  3. Set AI_PROVIDER=gemini\n" +
        "  4. Restart the development server\n" +
        "\n" +
        "  Affected features:\n" +
        "  • Resume Score Analysis\n" +
        "  • AI Bullet Improvement\n" +
        "  • ATS Keyword Analysis\n" +
        "  • Job Description Matching\n" +
        "  • Summary Generation\n" +
        "\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
      );
      throw new AIError(
        "GEMINI_API_KEY is not configured. Add your Gemini API key to the .env file and restart the server.",
        "MISSING_API_KEY",
        { status: 503, userFacing: true }
      );
    }

    this.client = new GoogleGenerativeAI(apiKey);

    const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    this.modelInstance = this.client.getGenerativeModel({ model: modelName });
    return this.modelInstance;
  }

  async complete(
    messages: AIChatMessage[],
    options?: AIProviderOptions,
  ): Promise<AIProviderResult> {
    const model = this.getModel();

    // Extract system instruction from the first message if it's a system message.
    // Patorbit always sends: [{ role: "system", ... }, { role: "user", ... }]
    let systemInstruction: string | undefined;
    let userContent = "";

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = msg.content;
      } else if (msg.role === "user") {
        userContent = msg.content;
      }
    }

    // Build generation config
    const generationConfig: Record<string, unknown> = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 256,
    };

    // JSON mode: Gemini supports responseMimeType for structured JSON output
    if (options?.jsonMode) {
      generationConfig.responseMimeType = "application/json";
    }

    // Rebuild model with system instruction if present
    const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const effectiveModel = systemInstruction
      ? this.client!.getGenerativeModel({
          model: modelName,
          systemInstruction,
        })
      : model;

    const doRequest = async () => {
      const result = await effectiveModel.generateContent({
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig,
      });

      const response = result.response;
      const content = response.text();

      if (!content) {
        throw new AIError("Gemini returned an empty response.", "UPSTREAM", {
          status: 502,
          userFacing: false,
        });
      }

      return {
        provider: this.name,
        model: modelName,
        content: content.trim(),
      };
    };

    try {
      return await doRequest();
    } catch (err) {
      // Single retry for transient 503 (Gemini free-tier high-demand overload)
      if (isTransient503(err)) {
        await delay(1000);
        try {
          return await doRequest();
        } catch (retryErr) {
          throw normalizeError(retryErr);
        }
      }
      throw normalizeError(err);
    }
  }

  async *completeStream(
    messages: AIChatMessage[],
    options?: AIProviderOptions,
  ): AsyncGenerator<string, void, unknown> {
    const model = this.getModel();

    let systemInstruction: string | undefined;
    let userContent = "";

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = msg.content;
      } else if (msg.role === "user") {
        userContent = msg.content;
      }
    }

    const generationConfig: Record<string, unknown> = {
      temperature: options?.temperature ?? 0.8,
      maxOutputTokens: options?.maxTokens ?? 512,
    };

    if (options?.jsonMode) {
      generationConfig.responseMimeType = "application/json";
    }

    const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const effectiveModel = systemInstruction
      ? this.client!.getGenerativeModel({
          model: modelName,
          systemInstruction,
        })
      : model;

    const doStream = async function* () {
      const result = await effectiveModel.generateContentStream({
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig,
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
    };

    try {
      yield* doStream();
    } catch (err) {
      // Single retry for transient 503
      if (isTransient503(err)) {
        await delay(1000);
        try {
          yield* doStream();
        } catch (retryErr) {
          throw normalizeError(retryErr);
        }
      } else {
        throw normalizeError(err);
      }
    }
  }
}

/** Map any thrown value to our stable AIError model. */
function normalizeError(err: unknown): AIError {
  if (err instanceof AIError) return err;

  const e = err as { status?: number; code?: string; message?: string; statusText?: string } | null | undefined;

  // Gemini SDK error messages
  const msg = (e?.message || "").toLowerCase();

  if (msg.includes("api key") || msg.includes("invalid key") || e?.status === 401 || e?.status === 403) {
    return new AIError(
      "Invalid Gemini API key. Please check your GEMINI_API_KEY configuration.",
      "MISSING_API_KEY",
      { status: 401, userFacing: true }
    );
  }

  if (msg.includes("rate limit") || e?.status === 429) {
    return new AIError(
      "Gemini rate limit exceeded. Please try again in a moment.",
      "RATE_LIMITED",
      { status: 429, userFacing: true }
    );
  }

  if (msg.includes("timeout") || msg.includes("deadline") || e?.code === "ETIMEDOUT" || e?.code === "ECONNABORTED") {
    return new AIError(
      "The AI request timed out. Please try again.",
      "TIMEOUT",
      { status: 408, userFacing: true }
    );
  }

  if (e?.status && e.status >= 500) {
    return new AIError(
      "The AI provider is experiencing issues. Please try again later.",
      "UPSTREAM",
      { status: 502, userFacing: true }
    );
  }

  return new AIError(
    `AI request failed: ${e?.message || "unknown error"}`,
    "UPSTREAM",
    { status: 502, userFacing: true }
  );
}

/** True when the error is a transient 503 (service overloaded). */
function isTransient503(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | null | undefined;
  if (e?.status === 503) return true;
  const msg = (e?.message || "").toLowerCase();
  return msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
