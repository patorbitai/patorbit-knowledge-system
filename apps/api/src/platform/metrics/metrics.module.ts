import {
  DynamicModule,
  Global,
  Module,
  Provider,
} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { MetricsInterceptor } from "./interceptors/metrics.interceptor";
import { METRICS_PROVIDER } from "./metrics.constants";
import type { MetricsProvider } from "./metrics.provider";
import { MetricsService } from "./metrics.service";
import { InMemoryMetricsProvider } from "./providers/in-memory.metrics-provider";
import { PrometheusMetricsProvider } from "./providers/prometheus.metrics-provider";

export type MetricsProviderType = "in-memory" | "prometheus";

export interface MetricsModuleOptions {
  provider?: MetricsProviderType | MetricsProvider;
}

@Global()
@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions = {}): DynamicModule {
    const metricsProvider = this.createProvider(options.provider ?? "in-memory");

    return {
      module: MetricsModule,
      global: true,
      providers: [
        metricsProvider,
        MetricsService,
        MetricsInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useExisting: MetricsInterceptor,
        },
      ],
      exports: [METRICS_PROVIDER, MetricsService],
    };
  }

  private static createProvider(
    provider: MetricsProviderType | MetricsProvider
  ): Provider {
    if (typeof provider !== "string") {
      return { provide: METRICS_PROVIDER, useValue: provider };
    }

    return {
      provide: METRICS_PROVIDER,
      useClass:
        provider === "prometheus"
          ? PrometheusMetricsProvider
          : InMemoryMetricsProvider,
    };
  }
}
