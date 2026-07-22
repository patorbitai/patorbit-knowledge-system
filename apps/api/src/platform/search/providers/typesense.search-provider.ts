import { Injectable } from "@nestjs/common";
import type {
  SearchDocument,
  SearchHealth,
  SearchIndexDefinition,
  SearchProvider,
  SearchQuery,
  SearchResponse,
} from "../search.provider";

/** Placeholder contract for a future Typesense client integration. */
@Injectable()
export class TypesenseSearchProvider implements SearchProvider {
  readonly name = "typesense";

  async index(_document: SearchDocument): Promise<void> {
    throw this.notConfigured();
  }

  async bulkIndex(_documents: SearchDocument[]): Promise<void> {
    throw this.notConfigured();
  }

  async remove(_index: string, _id: string): Promise<void> {
    throw this.notConfigured();
  }

  async search<T = Record<string, unknown>>(
    _query: SearchQuery
  ): Promise<SearchResponse<T>> {
    throw this.notConfigured();
  }

  async createIndex(_definition: SearchIndexDefinition): Promise<void> {
    throw this.notConfigured();
  }

  async deleteIndex(_index: string): Promise<void> {
    throw this.notConfigured();
  }

  async indexExists(_index: string): Promise<boolean> {
    throw this.notConfigured();
  }

  async health(): Promise<SearchHealth> {
    return {
      provider: this.name,
      status: "unavailable",
      details: { reason: "Typesense integration is a placeholder" },
    };
  }

  private notConfigured(): Error {
    return new Error("Typesense integration is not configured");
  }
}
