export { SearchModule, type SearchModuleOptions, type SearchProviderType } from "./search.module";
export { SearchService } from "./search.service";
export * from "./search.provider";
export { SEARCH_PROVIDER } from "./search.constants";
export { NoopSearchProvider } from "./providers/noop.search-provider";
export {
  OpenSearchSearchProvider,
  type OpenSearchProviderOptions,
} from "./providers/opensearch.search-provider";
export { TypesenseSearchProvider } from "./providers/typesense.search-provider";
