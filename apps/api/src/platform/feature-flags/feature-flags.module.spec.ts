import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { FeatureFlagsModule } from "./feature-flags.module";
import { FeatureFlagsService } from "./feature-flags.service";

describe("FeatureFlagsModule", () => {
  it("provides and exports FeatureFlagsService", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FeatureFlagsModule],
    }).compile();

    expect(moduleRef.get(FeatureFlagsService)).toBeInstanceOf(FeatureFlagsService);
    await moduleRef.close();
  });
});
