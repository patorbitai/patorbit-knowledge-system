import { Injectable, Logger } from "@nestjs/common";

import  {
  type GraphEdge,
  type GraphNode,
  type GraphPath,
  type GraphProvider,
  type GraphQueryResult,
  type GraphRepositoryStats,
} from "../graph.provider";

export interface Neo4jProviderOptions {
  uri: string;
  username: string;
  password: string;
}

/**
 * Neo4j provider placeholder. It exposes the full provider contract without
 * adding neo4j-driver as a dependency. Replace execute() with a driver session
 * when the dependency is introduced.
 */
@Injectable()
export class Neo4jGraphProvider implements GraphProvider {
  private readonly logger = new Logger(Neo4jGraphProvider.name);
  readonly name = "neo4j";

  constructor(private readonly options: Neo4jProviderOptions) {}

  async createNode(node: GraphNode): Promise<void> {
    await this.execute(
      "MERGE (n {id: $id}) SET n += $properties",
      { id: node.id, labels: node.labels, properties: node.properties }
    );
  }

  async createEdge(edge: GraphEdge): Promise<void> {
    await this.execute(
      "MATCH (a {id: $from}), (b {id: $to}) CREATE (a)-[r:RELATED_TO]->(b) SET r += $properties",
      {
        from: edge.from,
        to: edge.to,
        type: edge.type,
        properties: edge.properties ?? {},
      }
    );
  }

  async deleteNode(id: string): Promise<void> {
    await this.execute("MATCH (n {id: $id}) DETACH DELETE n", { id });
  }

  async query<T = Record<string, unknown>>(
    query: string,
    parameters?: Record<string, unknown>
  ): Promise<GraphQueryResult<T>> {
    return this.execute<T>(query, parameters);
  }

  async findPath(
    startNodeId: string,
    endNodeId: string,
    options?: { relationshipTypes?: string[]; maxDepth?: number }
  ): Promise<GraphPath | null> {
    const result = await this.execute<GraphPath>(
      "MATCH path = (start {id: $startNodeId})-[*1..15]-(end {id: $endNodeId}) RETURN path LIMIT 1",
      { startNodeId, endNodeId, ...options }
    );
    return result.records[0] ?? null;
  }

  async findNeighbors(
    nodeId: string,
    options?: {
      relationshipTypes?: string[];
      direction?: "outgoing" | "incoming" | "both";
      maxDepth?: number;
    }
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const result = await this.execute<{ node: GraphNode; edge: GraphEdge }>(
      "MATCH (start {id: $nodeId})-[edge]-(node) RETURN node, edge",
      { nodeId, ...options }
    );
    return {
      nodes: result.records.map(record => record.node),
      edges: result.records.map(record => record.edge),
    };
  }

  async shortestPath(
    startNodeId: string,
    endNodeId: string,
    options?: { relationshipTypes?: string[]; costProperty?: string }
  ): Promise<GraphPath | null> {
    const result = await this.execute<GraphPath>(
      "MATCH path = shortestPath((start {id: $startNodeId})-[*]-(end {id: $endNodeId})) RETURN path",
      { startNodeId, endNodeId, ...options }
    );
    return result.records[0] ?? null;
  }

  async stats(): Promise<GraphRepositoryStats> {
    const result = await this.execute<GraphRepositoryStats>(
      "MATCH (n) OPTIONAL MATCH ()-[r]->() RETURN count(DISTINCT n) AS nodeCount, count(r) AS edgeCount"
    );
    return result.records[0] ?? {
      nodeCount: 0,
      edgeCount: 0,
      labelDistribution: {},
      relationshipTypeDistribution: {},
    };
  }

  private async execute<T = Record<string, unknown>>(
    query: string,
    parameters?: Record<string, unknown>
  ): Promise<GraphQueryResult<T>> {
    this.logger.warn(
      `Neo4j driver is not installed; query skipped for ${this.options.uri}: ${query}`
    );
    void parameters;
    return {
      records: [],
      summary: { nodesCreated: 0, relationshipsCreated: 0, propertiesSet: 0 },
    };
  }
}
