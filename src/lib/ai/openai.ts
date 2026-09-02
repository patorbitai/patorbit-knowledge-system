"use strict";

import OpenAI from "openai";
import type {
  AIProvider,
  AIProviderOptions,
  AIProviderResult,
  AIChatMessage,
} from "./types";
import { AIError } from "./types";

/** Model used for all structured content generation. */
const MODEL = "gpt-4o-mini";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  private client: OpenAI | null = null;

  /** Lazily initialize the OpenAI client so a missing key throws only on use. */
  private getClient(): OpenAI {
    if (this.client) return this.client;

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
        "OPENAI_API_KEY is not configured. Add your OpenAI API key to the .env file and restart the server.",
        "MISSING_API_KEY",
        {
          status: 503,
          userFacing: true,
        }
      );
    }

    const opts: Record<string, string> = { apiKey };
    if (process.env.OPENAI_BASE_URL) opts.baseURL = process.env.OPENAI_BASE_URL;
    if (process.env.OPENAI_ORGANIZATION) opts.organization = process.env.OPENAI_ORGANIZATION;

    this.client = new OpenAI(opts);
    return this.client;
  }

  async complete(
    messages: AIChatMessage[],
    options?: AIProviderOptions,
  ): Promise<AIProviderResult> {
    const client = this.getClient();

    const body = {
      model: MODEL,
      messages: messages as never,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 256,
      ...(options?.jsonMode ? { response_format: { type: "json_object" } as const } : {}),
    };

    const requestOptions: { timeout?: number } = {};
    if (options?.timeoutMs) {
      requestOptions.timeout = options.timeoutMs;
    }

    try {
      const completion = await client.chat.completions.create(body as never, requestOptions);

      const content = extractText(completion.choices?.[0]?.message?.content);

      if (!content) {
        throw new AIError("OpenAI returned an empty response.", "UPSTREAM", {
          status: 502,
          userFacing: false,
        });
      }

      return {
        provider: this.name,
        model: MODEL,
        content: content.trim(),
      };
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async *completeStream(
    messages: AIChatMessage[],
    options?: AIProviderOptions,
  ): AsyncGenerator<string, void, unknown> {
    const client = this.getClient();

    const body = {
      model: MODEL,
      messages: messages as never,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 512,
      stream: true,
      ...(options?.jsonMode ? { response_format: { type: "json_object" } as const } : {}),
    };

    try {
      const stream = await client.chat.completions.create(body as never) as unknown as AsyncIterable<{ choices: { delta?: { content?: string } }[] }>;
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          yield delta;
        }
      }
    } catch (err) {
      throw normalizeError(err);
    }
  }
}

/** Flatten possibly-array message content to plain text. */
function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: "text"; text: string } =>
        typeof part === "object" &&
        part !== null &&
        (part as { type?: string }).type === "text",
      )
      .map((part) => part.text)
      .join("");
  }
  return "";
}

/** Map any thrown value to our stable AIError model. */
function normalizeError(err: unknown): AIError {
  if (err instanceof AIError) return err;

  const e = err as { status?: number; code?: string; message?: string } | null | undefined;

  if (e?.status === 401) {
    return new AIError("Invalid OpenAI API key.", "MISSING_API_KEY", {
      status: 401,
      userFacing: true,
    });
  }

  if (e?.status === 429) {
    return new AIError("OpenAI rate limit exceeded. Please try again in a moment.", "RATE_LIMITED", {
      status: 429,
      userFacing: true,
    });
  }

  if (
    e?.code === "ECONNABORTED" ||
    e?.code === "ETIMEDOUT" ||
    e?.code === "UND_ERR_CONNECT_TIMEOUT"
  ) {
    return new AIError("The AI request timed out. Please try again.", "TIMEOUT", {
      status: 408,
      userFacing: true,
    });
  }

  if (e?.status && e.status >= 500) {
    return new AIError("The AI provider is experiencing issues. Please try again later.", "UPSTREAM", {
      status: 502,
      userFacing: true,
    });
  }

  return new AIError(
    `AI request failed: ${e?.message || "unknown error"}`,
    "UPSTREAM",
    { status: 502, userFacing: true },
  );
}
