import { type DynamicModule, Module, type Provider } from "@nestjs/common";

import { NoopSearchProvider } from "./providers/noop.search-provider";
import {
  type OpenSearchProviderOptions,
  OpenSearchSearchProvider,
} from "./providers/opensearch.search-provider";
import { TypesenseSearchProvider } from "./providers/typesense.search-provider";
import { SEARCH_PROVIDER } from "./search.constants";
import { SearchService } from "./search.service";

export type SearchProviderType = "noop" | "opensearch" | "typesense";

export interface SearchModuleOptions extends OpenSearchProviderOptions {
  provider: SearchProviderType;
}

@Module({})
export class SearchModule {
  static forRoot(options?: SearchModuleOptions): DynamicModule {
    const providerType = options?.provider ?? "noop";
    let provider: Provider;

    if (providerType === "opensearch") {
      provider = {
        provide: SEARCH_PROVIDER,
        useFactory: () => new OpenSearchSearchProvider(options),
      };
    } else if (providerType === "typesense") {
      provider = {
        provide: SEARCH_PROVIDER,
        useClass: TypesenseSearchProvider,
      };
    } else {
      provider = {
        provide: SEARCH_PROVIDER,
        useClass: NoopSearchProvider,
      };
    }

    return {
      module: SearchModule,
      global: true,
      providers: [provider, SearchService],
      exports: [SearchService],
    };
  }
}
