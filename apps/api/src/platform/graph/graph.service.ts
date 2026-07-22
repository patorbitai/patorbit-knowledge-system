import { Inject, Injectable } from "@nestjs/common";

import { GRAPH_PROVIDER } from "./graph.constants";
import  {
  type GraphEdge,
  type GraphNode,
  type GraphPath,
  type GraphProvider,
  type GraphQueryResult,
  type GraphRepositoryStats,
} from "./graph.provider";

@Injectable()
export class GraphService {
  constructor(
    @Inject(GRAPH_PROVIDER) private readonly provider: GraphProvider
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  // ---- Node Lifecycle ----

  async createNode(node: GraphNode): Promise<void> {
    return this.provider.createNode(node);
  }

  async deleteNode(id: string): Promise<void> {
    return this.provider.deleteNode(id);
  }

  // ---- Edge Lifecycle ----

  async createEdge(edge: GraphEdge): Promise<void> {
    return this.provider.createEdge(edge);
  }

  // ---- Query ----

  async query<T = Record<string, unknown>>(
    query: string,
    parameters?: Record<string, unknown>
  ): Promise<GraphQueryResult<T>> {
    return this.provider.query<T>(query, parameters);
  }

  // ---- Traversal ----

  async findPath(
    startNodeId: string,
    endNodeId: string,
    options?: { relationshipTypes?: string[]; maxDepth?: number }
  ): Promise<GraphPath | null> {
    return this.provider.findPath(startNodeId, endNodeId, options);
  }

  async findNeighbors(
    nodeId: string,
    options?: {
      relationshipTypes?: string[];
      direction?: "outgoing" | "incoming" | "both";
      maxDepth?: number;
    }
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    return this.provider.findNeighbors(nodeId, options);
  }

  async shortestPath(
    startNodeId: string,
    endNodeId: string,
    options?: { relationshipTypes?: string[]; costProperty?: string }
  ): Promise<GraphPath | null> {
    return this.provider.shortestPath(startNodeId, endNodeId, options);
  }

  // ---- Repository Abstraction ----

  async stats(): Promise<GraphRepositoryStats> {
    return this.provider.stats();
  }
}