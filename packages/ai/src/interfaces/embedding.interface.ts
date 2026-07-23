export interface EmbeddingProvider {
  name: string;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  /** Dimensionality of the embedding vectors returned by this provider. */
  dimensions: number;
}
