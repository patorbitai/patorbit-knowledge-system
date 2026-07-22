export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id?: string;
  from: string;
  to: string;
  type: string;
  properties?: Record<string, unknown>;
}

export interface GraphQueryResult<T = Record<string, unknown>> {
  records: T[];
  summary: {
    nodesCreated: number;
    relationshipsCreated: number;
    propertiesSet: number;
  };
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  cost?: number;
}

export interface GraphTraversalQuery {
  startNodeId: string;
  endNodeId?: string;
  relationshipTypes?: string[];
  direction?: "outgoing" | "incoming" | "both";
  maxDepth?: number;
}

export interface GraphRepositoryStats {
  nodeCount: number;
  edgeCount: number;
  labelDistribution: Record<string, number>;
  relationshipTypeDistribution: Record<string, number>;
}

export interface GraphProvider {
  readonly name: string;

  // Node lifecycle
  createNode(node: GraphNode): Promise<void>;
  deleteNode(id: string): Promise<void>;

  // Edge lifecycle
  createEdge(edge: GraphEdge): Promise<void>;

  // Query
  query<T = Record<string, unknown>>(
    query: string,
    parameters?: Record<string, unknown>
  ): Promise<GraphQueryResult<T>>;

  // Traversal
  findPath(startNodeId: string, endNodeId: string, options?: {
    relationshipTypes?: string[];
    maxDepth?: number;
  }): Promise<GraphPath | null>;

  findNeighbors(nodeId: string, options?: {
    relationshipTypes?: string[];
    direction?: "outgoing" | "incoming" | "both";
    maxDepth?: number;
  }): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }>;

  shortestPath(startNodeId: string, endNodeId: string, options?: {
    relationshipTypes?: string[];
    costProperty?: string;
  }): Promise<GraphPath | null>;

  // Repository abstraction
  stats(): Promise<GraphRepositoryStats>;
}
