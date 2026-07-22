import { Inject, Injectable } from "@nestjs/common";

import { SEARCH_PROVIDER } from "./search.constants";
import  {
  type SearchDocument,
  type SearchHealth,
  type SearchIndexDefinition,
  type SearchProvider,
  type SearchQuery,
  type SearchResponse,
} from "./search.provider";

@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_PROVIDER) private readonly provider: SearchProvider
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  // ---- Core Operations ----

  async index(document: SearchDocument): Promise<void> {
    return this.provider.index(document);
  }

  async bulkIndex(documents: SearchDocument[]): Promise<void> {
    return this.provider.bulkIndex(documents);
  }

  async remove(index: string, id: string): Promise<void> {
    return this.provider.remove(index, id);
  }

  async search<T = Record<string, unknown>>(
    query: SearchQuery
  ): Promise<SearchResponse<T>> {
    return this.provider.search<T>(query);
  }

  // ---- Index Lifecycle ----

  async createIndex(definition: SearchIndexDefinition): Promise<void> {
    return this.provider.createIndex(definition);
  }

  async deleteIndex(index: string): Promise<void> {
    return this.provider.deleteIndex(index);
  }

  async indexExists(index: string): Promise<boolean> {
    return this.provider.indexExists(index);
  }

  // ---- Health ----

  async health(): Promise<SearchHealth> {
    return this.provider.health();
  }
}
