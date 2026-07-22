import { Injectable } from "@nestjs/common";

import  {
  type Counter,
  type Histogram,
  type MetricOptions,
  type MetricsProvider,
  type Timer,
} from "../metrics.provider";
import {
  type InMemoryMetric,
  InMemoryMetricsProvider,
} from "./in-memory.metrics-provider";

/**
 * Prometheus-compatible provider boundary.
 *
 * This currently delegates to the in-memory implementation so the application
 * can select the provider without requiring prom-client. Replace the delegate
 * with prom-client collectors when that integration is introduced.
 */
@Injectable()
export class PrometheusMetricsProvider implements MetricsProvider {
  readonly name = "prometheus";
  private readonly delegate = new InMemoryMetricsProvider();

  get metrics(): Map<string, InMemoryMetric> {
    return this.delegate.metrics;
  }

  createCounter(name: string, options?: MetricOptions): Counter {
    return this.delegate.createCounter(name, options);
  }

  createTimer(name: string, options?: MetricOptions): Timer {
    return this.delegate.createTimer(name, options);
  }

  createHistogram(name: string, options?: MetricOptions): Histogram {
    return this.delegate.createHistogram(name, options);
  }

  clear(): void {
    this.delegate.clear();
  }
}
