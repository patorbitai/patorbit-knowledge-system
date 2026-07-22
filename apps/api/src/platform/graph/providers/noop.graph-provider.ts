import { Injectable, Logger } from "@nestjs/common";
import type {
  GraphEdge,
  GraphNode,
  GraphPath,
  GraphProvider,
  GraphQueryResult,
  GraphRepositoryStats,
} from "../graph.provider";

@Injectable()
export class NoopGraphProvider implements GraphProvider {
  private readonly logger = new Logger(NoopGraphProvider.name);
  readonly name = "noop";

  async createNode(node: GraphNode): Promise<void> {
    this.logger.debug(`[noop] createNode: ${node.id} [${node.labels.join(", ")}]`);
  }

  async createEdge(edge: GraphEdge): Promise<void> {
    this.logger.debug(`[noop] createEdge: ${edge.from} -[${edge.type}]-> ${edge.to}`);
  }

  async deleteNode(id: string): Promise<void> {
    this.logger.debug(`[noop] deleteNode: ${id}`);
  }

  async query<T = Record<string, unknown>>(
    query: string,
    parameters?: Record<string, unknown>
  ): Promise<GraphQueryResult<T>> {
    this.logger.debug(`[noop] query: ${query} ${JSON.stringify(parameters ?? {})}`);
    return {
      records: [],
      summary: { nodesCreated: 0, relationshipsCreated: 0, propertiesSet: 0 },
    };
  }

  async findPath(
    startNodeId: string,
    endNodeId: string,
    _options?: any
  ): Promise<GraphPath | null> {
    this.logger.debug(`[noop] findPath: ${startNodeId} -> ${endNodeId}`);
    return null;
  }

  async findNeighbors(nodeId: string, _options?: any): Promise<{ nodes: GraphNode[], edges: GraphEdge[] }> {
    this.logger.debug(`[noop] findNeighbors: ${nodeId}`);
    return { nodes: [], edges: [] };
  }

  async shortestPath(
    startNodeId: string,
    endNodeId: string,
    _options?: any
  ): Promise<GraphPath | null> {
    this.logger.debug(`[noop] shortestPath: ${startNodeId} -> ${endNodeId}`);
    return null;
  }

  async stats(): Promise<GraphRepositoryStats> {
    return {
      nodeCount: 0,
      edgeCount: 0,
      labelDistribution: {},
      relationshipTypeDistribution: {},
    };
  }
}
