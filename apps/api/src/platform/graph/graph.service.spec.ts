import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GRAPH_PROVIDER } from "./graph.constants";
import  { type GraphEdge, type GraphNode, type GraphProvider } from "./graph.provider";
import { GraphService } from "./graph.service";

describe("GraphService", () => {
  let service: GraphService;
  let provider: GraphProvider;

  beforeEach(async () => {
    provider = {
      name: "test-graph",
      createNode: vi.fn().mockResolvedValue(undefined),
      createEdge: vi.fn().mockResolvedValue(undefined),
      deleteNode: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({
        records: [{ id: "node-1" }],
        summary: { nodesCreated: 0, relationshipsCreated: 0, propertiesSet: 0 },
      }),
      findPath: vi.fn().mockResolvedValue(null),
      findNeighbors: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
      shortestPath: vi.fn().mockResolvedValue(null),
      stats: vi.fn().mockResolvedValue({
        nodeCount: 0,
        edgeCount: 0,
        labelDistribution: {},
        relationshipTypeDistribution: {},
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GraphService, { provide: GRAPH_PROVIDER, useValue: provider }],
    }).compile();
    service = module.get(GraphService);
  });

  it("reports the provider name", () => {
    expect(service.providerName).toBe("test-graph");
  });

  it("delegates node, edge, deletion, and query operations", async () => {
    const node: GraphNode = { id: "node-1", labels: ["Concept"], properties: { title: "One" } };
    const edge: GraphEdge = { from: "node-1", to: "node-2", type: "RELATES_TO" };
    const parameters = { id: "node-1" };

    await service.createNode(node);
    await service.createEdge(edge);
    await service.deleteNode("node-1");
    await expect(service.query("MATCH (n) WHERE n.id = $id RETURN n", parameters)).resolves.toEqual({
      records: [{ id: "node-1" }],
      summary: { nodesCreated: 0, relationshipsCreated: 0, propertiesSet: 0 },
    });

    expect(provider.createNode).toHaveBeenCalledWith(node);
    expect(provider.createEdge).toHaveBeenCalledWith(edge);
    expect(provider.deleteNode).toHaveBeenCalledWith("node-1");
    expect(provider.query).toHaveBeenCalledWith(
      "MATCH (n) WHERE n.id = $id RETURN n",
      parameters
    );
  });
});
