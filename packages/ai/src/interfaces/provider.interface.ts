export interface AiProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  /** Whether to enable streaming output. */
  stream?: boolean;
  /** Stop sequences. */
  stop?: string[];
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

export interface AiProvider {
  name: string;
  generate(prompt: string, options?: AiProviderOptions): Promise<AiProviderResult>;
  generateStream?(
    prompt: string,
    options?: AiProviderOptions,
  ): AsyncIterable<string>;
}

export interface EmbeddingProvider {
  name: string;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
