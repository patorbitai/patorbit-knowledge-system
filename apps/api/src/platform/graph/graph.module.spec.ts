import { Test, type TestingModule } from "@nestjs/testing";
import { afterEach, describe, expect, it } from "vitest";

import { GraphModule } from "./graph.module";
import { GraphService } from "./graph.service";

describe("GraphModule", () => {
  let module: TestingModule;

  afterEach(async () => {
    await module?.close();
  });

  it("compiles the full noop module and exports GraphService", async () => {
    const exportedService = Symbol("EXPORTED_GRAPH_SERVICE");
    module = await Test.createTestingModule({
      imports: [GraphModule.forRoot({ provider: "noop" })],
      providers: [
        {
          provide: exportedService,
          inject: [GraphService],
          useFactory: (service: GraphService) => service,
        },
      ],
    }).compile();

    const service = module.get<GraphService>(exportedService);

    expect(service).toBeInstanceOf(GraphService);
    expect(service.providerName).toBe("noop");
    await expect(service.query("MATCH (n) RETURN n")).resolves.toEqual({
      records: [],
      summary: {
        nodesCreated: 0,
        relationshipsCreated: 0,
        propertiesSet: 0,
      },
    });
  });
});
