"use strict";

/**
 * AI Provider Registry / Factory
 *
 * Returns the currently-active provider implementation. The service layer
 * calls this factory rather than importing a provider directly, so swapping
 * providers (or adding Anthropic / Gemini / Azure) means changing this file
 * and the provider implementation — not the service or the frontend.
 */
import type { AIProvider } from "./types";
import { OpenAIProvider } from "./openai";

const providers: Record<string, AIProvider> = {
  openai: new OpenAIProvider(),
  // anthropic: new AnthropicProvider(),  // future
  // gemini: new GeminiProvider(),        // future
};

export function getAIProvider(providerName?: string): AIProvider {
  const name = providerName || process.env.AI_PROVIDER || "openai";
  const provider = providers[name];

  if (!provider) {
    throw new Error(
      `AI Provider "${name}" not found. Available providers: ${Object.keys(providers).join(", ")}`,
    );
  }

  return provider;
}