export interface SearchDocument {
  id: string;
  index: string;
  body: Record<string, unknown>;
}

export interface SearchQuery {
  index: string;
  query: string;
  filters?: Record<string, unknown>;
  from?: number;
  size?: number;
}

export interface SearchResult<T = Record<string, unknown>> {
  id: string;
  score: number;
  source: T;
}

export interface SearchResponse<T = Record<string, unknown>> {
  total: number;
  took: number;
  results: SearchResult<T>[];
}

export interface SearchIndexDefinition {
  name: string;
  settings?: Record<string, unknown>;
  mappings?: Record<string, unknown>;
}

export type SearchHealthStatus = "healthy" | "degraded" | "unavailable";

export interface SearchHealth {
  provider: string;
  status: SearchHealthStatus;
  details?: Record<string, unknown>;
}

export interface SearchProvider {
  readonly name: string;
  index(document: SearchDocument): Promise<void>;
  bulkIndex(documents: SearchDocument[]): Promise<void>;
  remove(index: string, id: string): Promise<void>;
  search<T = Record<string, unknown>>(query: SearchQuery): Promise<SearchResponse<T>>;
  createIndex(definition: SearchIndexDefinition): Promise<void>;
  deleteIndex(index: string): Promise<void>;
  indexExists(index: string): Promise<boolean>;
  health(): Promise<SearchHealth>;
}
