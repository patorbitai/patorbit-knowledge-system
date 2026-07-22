import { Test, type TestingModule } from "@nestjs/testing";
import { afterEach, describe, expect, it } from "vitest";
import { SearchModule } from "./search.module";
import { SearchService } from "./search.service";

describe("SearchModule", () => {
  let module: TestingModule;

  afterEach(async () => {
    await module?.close();
  });

  it("compiles the full noop module and exports SearchService", async () => {
    const exportedService = Symbol("EXPORTED_SEARCH_SERVICE");
    module = await Test.createTestingModule({
      imports: [SearchModule.forRoot({ provider: "noop" })],
      providers: [
        {
          provide: exportedService,
          inject: [SearchService],
          useFactory: (service: SearchService) => service,
        },
      ],
    }).compile();

    const service = module.get<SearchService>(exportedService);

    expect(service).toBeInstanceOf(SearchService);
    expect(service.providerName).toBe("noop");
    await expect(service.search({ index: "docs", query: "test" })).resolves.toEqual({
      total: 0,
      took: 0,
      results: [],
    });
  });
});
