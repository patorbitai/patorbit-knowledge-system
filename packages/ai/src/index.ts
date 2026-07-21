// AI Package
// AI model abstraction layer
// Provides interfaces and base infrastructure for interacting with AI models

export interface AiProvider {
  name: string;
  generate(prompt: string, options?: AiProviderOptions): Promise<AiProviderResult>;
}

export interface AiProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AiProviderResult {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
