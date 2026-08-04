"use strict";

/**
 * AI Provider Adapter Contract
 *
 * Every LLM provider (OpenAI today, Anthropic tomorrow) implements this interface.
 * The AI Service Layer depends only on this contract, so new providers can be added
 * without touching frontend code.
 */

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProviderOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}

export interface AIProviderResult {
  content: string;
  provider: string;
  model: string;
}

export type AIErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UPSTREAM"
  | "UNSUPPORTED_ACTION";

export class AIError extends Error {
  code: AIErrorCode;
  userFacing: boolean;
  status: number;

  constructor(
    message: string,
    code: AIErrorCode,
    opts: { status?: number; userFacing?: boolean } = {},
  ) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.status = opts.status ?? 500;
    this.userFacing = opts.userFacing ?? true;
  }
}

export interface AIProvider {
  readonly name: string;
  complete(
    messages: AIChatMessage[],
    options?: AIProviderOptions,
  ): Promise<AIProviderResult>;
}