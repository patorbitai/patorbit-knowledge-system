import { Injectable } from "@nestjs/common";
import type {
  SearchDocument,
  SearchHealth,
  SearchIndexDefinition,
  SearchProvider,
  SearchQuery,
  SearchResponse,
} from "../search.provider";

export interface OpenSearchProviderOptions {
  node?: string;
  username?: string;
  password?: string;
}

interface OpenSearchHit<T> {
  _id: string;
  _score?: number;
  _source: T;
}

interface OpenSearchSearchResponse<T> {
  took?: number;
  hits?: {
    total?: number | { value: number };
    hits?: OpenSearchHit<T>[];
  };
}

/**
 * Lightweight OpenSearch REST provider. It intentionally uses the platform
 * fetch API so OpenSearch support does not add a client dependency. This can
 * be replaced by @opensearch-project/opensearch without changing the contract.
 */
@Injectable()
export class OpenSearchSearchProvider implements SearchProvider {
  readonly name = "opensearch";
  private readonly node: string;
  private readonly authorization?: string;

  constructor(options: OpenSearchProviderOptions = {}) {
    this.node = (options.node ?? "http://localhost:9200").replace(/\/$/, "");
    if (options.username) {
      this.authorization = `Basic ${Buffer.from(
        `${options.username}:${options.password ?? ""}`
      ).toString("base64")}`;
    }
  }

  async index(document: SearchDocument): Promise<void> {
    await this.request(`/${this.segment(document.index)}/_doc/${this.segment(document.id)}`, {
      method: "PUT",
      body: JSON.stringify(document.body),
    });
  }

  async bulkIndex(documents: SearchDocument[]): Promise<void> {
    if (documents.length === 0) return;

    const body = documents
      .flatMap(document => [
        JSON.stringify({
          index: { _index: document.index, _id: document.id },
        }),
        JSON.stringify(document.body),
      ])
      .join("\n");

    await this.request("/_bulk", {
      method: "POST",
      headers: { "content-type": "application/x-ndjson" },
      body: `${body}\n`,
    });
  }

  async remove(index: string, id: string): Promise<void> {
    await this.request(`/${this.segment(index)}/_doc/${this.segment(id)}`, {
      method: "DELETE",
    });
  }

  async search<T = Record<string, unknown>>(
    query: SearchQuery
  ): Promise<SearchResponse<T>> {
    const filters = Object.entries(query.filters ?? {}).map(([field, value]) => ({
      term: { [field]: value },
    }));
    const body = {
      from: query.from ?? 0,
      size: query.size ?? 10,
      query: filters.length
        ? {
            bool: {
              must: query.query ? [{ query_string: { query: query.query } }] : [],
              filter: filters,
            },
          }
        : { query_string: { query: query.query || "*" } },
    };

    const response = await this.request<OpenSearchSearchResponse<T>>(
      `/${this.segment(query.index)}/_search`,
      { method: "POST", body: JSON.stringify(body) }
    );
    const total = response.hits?.total;

    return {
      total: typeof total === "number" ? total : total?.value ?? 0,
      took: response.took ?? 0,
      results: (response.hits?.hits ?? []).map(hit => ({
        id: hit._id,
        score: hit._score ?? 0,
        source: hit._source,
      })),
    };
  }

  async createIndex(definition: SearchIndexDefinition): Promise<void> {
    await this.request(`/${this.segment(definition.name)}`, {
      method: "PUT",
      body: JSON.stringify({
        settings: definition.settings,
        mappings: definition.mappings,
      }),
    });
  }

  async deleteIndex(index: string): Promise<void> {
    await this.request(`/${this.segment(index)}`, { method: "DELETE" });
  }

  async indexExists(index: string): Promise<boolean> {
    const response = await fetch(`${this.node}/${this.segment(index)}`, {
      method: "HEAD",
      headers: this.headers(),
    });
    if (response.status === 404) return false;
    if (!response.ok) {
      throw new Error(`OpenSearch request failed (${response.status} ${response.statusText})`);
    }
    return true;
  }

  async health(): Promise<SearchHealth> {
    try {
      const details = await this.request<Record<string, unknown>>("/_cluster/health");
      const clusterStatus = String(details.status ?? "unknown");
      return {
        provider: this.name,
        status:
          clusterStatus === "green"
            ? "healthy"
            : clusterStatus === "yellow"
              ? "degraded"
              : "unavailable",
        details,
      };
    } catch (error) {
      return {
        provider: this.name,
        status: "unavailable",
        details: { error: (error as Error).message },
      };
    }
  }

  private async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.node}${path}`, {
      ...init,
      headers: { ...this.headers(), ...init.headers },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OpenSearch request failed (${response.status} ${response.statusText}): ${body}`
      );
    }
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      ...(this.authorization ? { authorization: this.authorization } : {}),
    };
  }

  private segment(value: string): string {
    return encodeURIComponent(value);
  }
}
