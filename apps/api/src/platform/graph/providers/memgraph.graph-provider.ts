import { Injectable } from "@nestjs/common";

import  {
  type GraphEdge,
  type GraphNode,
  type GraphPath,
  type GraphProvider,
  type GraphQueryResult,
  type GraphRepositoryStats,
} from "../graph.provider";

/** Placeholder contract for a future Memgraph driver integration. */
@Injectable()
export class MemgraphGraphProvider implements GraphProvider {
  readonly name = "memgraph";

  async createNode(_node: GraphNode): Promise<void> {
    throw this.notConfigured();
  }

  async createEdge(_edge: GraphEdge): Promise<void> {
    throw this.notConfigured();
  }

  async deleteNode(_id: string): Promise<void> {
    throw this.notConfigured();
  }

  async query<T = Record<string, unknown>>(
    _query: string,
    _parameters?: Record<string, unknown>
  ): Promise<GraphQueryResult<T>> {
    throw this.notConfigured();
  }

  async findPath(
    _startNodeId: string,
    _endNodeId: string,
    _options?: { relationshipTypes?: string[]; maxDepth?: number }
  ): Promise<GraphPath | null> {
    throw this.notConfigured();
  }

  async findNeighbors(
    _nodeId: string,
    _options?: {
      relationshipTypes?: string[];
      direction?: "outgoing" | "incoming" | "both";
      maxDepth?: number;
    }
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    throw this.notConfigured();
  }

  async shortestPath(
    _startNodeId: string,
    _endNodeId: string,
    _options?: { relationshipTypes?: string[]; costProperty?: string }
  ): Promise<GraphPath | null> {
    throw this.notConfigured();
  }

  async stats(): Promise<GraphRepositoryStats> {
    throw this.notConfigured();
  }

  private notConfigured(): Error {
    return new Error("Memgraph integration is not configured");
  }
}
