import { describe, expect, it } from "vitest";

import { NoopGraphProvider } from "./noop.graph-provider";

describe("NoopGraphProvider", () => {
  const provider = new NoopGraphProvider();

  it("exposes noop identity and a deterministic empty query shape", async () => {
    expect(provider.name).toBe("noop");
    await expect(provider.query("MATCH (n) RETURN n", { limit: 10 })).resolves.toEqual({
      records: [],
      summary: {
        nodesCreated: 0,
        relationshipsCreated: 0,
        propertiesSet: 0,
      },
    });
  });

  it("accepts graph mutations without side effects", async () => {
    await expect(
      provider.createNode({ id: "node-1", labels: ["Concept"], properties: {} })
    ).resolves.toBeUndefined();
    await expect(
      provider.createEdge({ from: "node-1", to: "node-2", type: "RELATES_TO" })
    ).resolves.toBeUndefined();
    await expect(provider.deleteNode("node-1")).resolves.toBeUndefined();
  });
});
