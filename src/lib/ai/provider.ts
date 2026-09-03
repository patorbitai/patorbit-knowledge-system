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
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";

/** Lazily-created provider instances — only the selected one is ever created. */
let cachedProvider: AIProvider | null = null;
let cachedProviderName: string | null = null;

export function getAIProvider(providerName?: string): AIProvider {
  const name = providerName || process.env.AI_PROVIDER || "gemini";

  // Return cached instance if the provider hasn't changed
  if (cachedProvider && cachedProviderName === name) {
    return cachedProvider;
  }

  let provider: AIProvider;

  switch (name) {
    case "gemini":
      provider = new GeminiProvider();
      break;
    case "openai":
      provider = new OpenAIProvider();
      break;
    default:
      throw new Error(
        `AI Provider "${name}" not found. Available providers: gemini, openai`,
      );
  }

  cachedProvider = provider;
  cachedProviderName = name;
  return provider;
}

/** Reset cached provider — for tests only. */
export function _resetProviderCache(): void {
  cachedProvider = null;
  cachedProviderName = null;
}