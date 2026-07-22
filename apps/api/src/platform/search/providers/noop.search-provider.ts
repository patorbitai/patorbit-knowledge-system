import { Injectable, Logger } from "@nestjs/common";

import  {
  type SearchDocument,
  type SearchHealth,
  type SearchIndexDefinition,
  type SearchProvider,
  type SearchQuery,
  type SearchResponse,
} from "../search.provider";

@Injectable()
export class NoopSearchProvider implements SearchProvider {
  private readonly logger = new Logger(NoopSearchProvider.name);
  readonly name = "noop";

  async index(document: SearchDocument): Promise<void> {
    this.logger.debug(`[noop] index: ${document.index}/${document.id}`);
  }

  async bulkIndex(documents: SearchDocument[]): Promise<void> {
    this.logger.debug(`[noop] bulkIndex: ${documents.length} documents`);
  }

  async remove(index: string, id: string): Promise<void> {
    this.logger.debug(`[noop] remove: ${index}/${id}`);
  }

  async search<T = Record<string, unknown>>(
    query: SearchQuery
  ): Promise<SearchResponse<T>> {
    this.logger.debug(`[noop] search: ${query.index} - "${query.query}"`);
    return { total: 0, took: 0, results: [] };
  }

  async createIndex(definition: SearchIndexDefinition): Promise<void> {
    this.logger.debug(`[noop] createIndex: ${definition.name}`);
  }

  async deleteIndex(index: string): Promise<void> {
    this.logger.debug(`[noop] deleteIndex: ${index}`);
  }

  async indexExists(index: string): Promise<boolean> {
    this.logger.debug(`[noop] indexExists: ${index}`);
    return false;
  }

  async health(): Promise<SearchHealth> {
    return { provider: this.name, status: "healthy", details: { mode: "noop" } };
  }
}
