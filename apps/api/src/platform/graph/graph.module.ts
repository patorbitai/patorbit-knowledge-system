import { type DynamicModule, Module, type Provider } from "@nestjs/common";

import { GRAPH_PROVIDER } from "./graph.constants";
import { GraphService } from "./graph.service";
import { MemgraphGraphProvider } from "./providers/memgraph.graph-provider";
import { Neo4jGraphProvider, type Neo4jProviderOptions } from "./providers/neo4j.graph-provider";
import { NoopGraphProvider } from "./providers/noop.graph-provider";

export type GraphProviderType = "noop" | "neo4j" | "memgraph";

export interface GraphModuleOptions extends Partial<Neo4jProviderOptions> {
  provider: GraphProviderType;
}

@Module({})
export class GraphModule {
  static forRoot(options?: GraphModuleOptions): DynamicModule {
    const providerType = options?.provider ?? "noop";
    let provider: Provider;

    if (providerType === "neo4j") {
      provider = {
        provide: GRAPH_PROVIDER,
        useFactory: () =>
          new Neo4jGraphProvider({
            uri: options?.uri ?? "bolt://localhost:7687",
            username: options?.username ?? "neo4j",
            password: options?.password ?? "password",
          }),
      };
    } else if (providerType === "memgraph") {
      provider = {
        provide: GRAPH_PROVIDER,
        useClass: MemgraphGraphProvider,
      };
    } else {
      provider = {
        provide: GRAPH_PROVIDER,
        useClass: NoopGraphProvider,
      };
    }

    return {
      module: GraphModule,
      global: true,
      providers: [provider, GraphService],
      exports: [GraphService],
    };
  }
}