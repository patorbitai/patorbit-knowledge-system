import { Injectable } from "@nestjs/common";

import  {
  type Counter,
  type Histogram,
  type MetricLabels,
  type MetricOptions,
  type MetricsProvider,
  type Timer,
  type TimerStop,
} from "../metrics.provider";

export interface InMemoryCounterMetric {
  type: "counter";
  description?: string;
  values: Map<string, number>;
}

export interface InMemoryDistributionMetric {
  type: "timer" | "histogram";
  description?: string;
  values: Map<string, number[]>;
}

export type InMemoryMetric =
  | InMemoryCounterMetric
  | InMemoryDistributionMetric;

function labelsKey(labels: MetricLabels = {}): string {
  const sortedLabels = Object.keys(labels)
    .sort()
    .reduce<MetricLabels>((result, key) => {
      result[key] = labels[key];
      return result;
    }, {});

  return JSON.stringify(sortedLabels);
}

function assertMetricName(name: string): void {
  if (!name.trim()) {
    throw new Error("Metric name must not be empty");
  }
}

function assertFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}

class InMemoryCounter implements Counter {
  constructor(private readonly metric: InMemoryCounterMetric) {}

  increment(value = 1, labels: MetricLabels = {}): void {
    this.update(value, labels);
  }

  decrement(value = 1, labels: MetricLabels = {}): void {
    this.update(-value, labels);
  }

  private update(delta: number, labels: MetricLabels): void {
    assertFinite(delta, "Counter value");
    const key = labelsKey(labels);
    this.metric.values.set(key, (this.metric.values.get(key) ?? 0) + delta);
  }
}

class InMemoryHistogram implements Histogram {
  constructor(private readonly metric: InMemoryDistributionMetric) {}

  record(value: number, labels: MetricLabels = {}): void {
    assertFinite(value, "Histogram value");
    const key = labelsKey(labels);
    const values = this.metric.values.get(key) ?? [];
    values.push(value);
    this.metric.values.set(key, values);
  }
}

class InMemoryTimer implements Timer {
  constructor(private readonly metric: InMemoryDistributionMetric) {}

  start(labels: MetricLabels = {}): TimerStop {
    const startedAt = process.hrtime.bigint();
    return (additionalLabels: MetricLabels = {}): number => {
      const elapsedNanoseconds = process.hrtime.bigint() - startedAt;
      const durationMs = Number(elapsedNanoseconds) / 1_000_000;
      this.record(durationMs, { ...labels, ...additionalLabels });
      return durationMs;
    };
  }

  record(durationMs: number, labels: MetricLabels = {}): void {
    assertFinite(durationMs, "Timer duration");
    const key = labelsKey(labels);
    const values = this.metric.values.get(key) ?? [];
    values.push(durationMs);
    this.metric.values.set(key, values);
  }
}

@Injectable()
export class InMemoryMetricsProvider implements MetricsProvider {
  readonly name = "in-memory";
  readonly metrics = new Map<string, InMemoryMetric>();

  createCounter(name: string, options: MetricOptions = {}): Counter {
    assertMetricName(name);
    const metric = this.getOrCreateCounter(name, options);
    return new InMemoryCounter(metric);
  }

  createTimer(name: string, options: MetricOptions = {}): Timer {
    assertMetricName(name);
    const metric = this.getOrCreateDistribution(name, "timer", options);
    return new InMemoryTimer(metric);
  }

  createHistogram(name: string, options: MetricOptions = {}): Histogram {
    assertMetricName(name);
    const metric = this.getOrCreateDistribution(name, "histogram", options);
    return new InMemoryHistogram(metric);
  }

  clear(): void {
    this.metrics.clear();
  }

  private getOrCreateCounter(
    name: string,
    options: MetricOptions
  ): InMemoryCounterMetric {
    const existing = this.metrics.get(name);
    if (existing) {
      if (existing.type !== "counter") {
        throw new Error(`Metric \"${name}\" is already registered as ${existing.type}`);
      }
      return existing;
    }

    const metric: InMemoryCounterMetric = {
      type: "counter",
      description: options.description,
      values: new Map(),
    };
    this.metrics.set(name, metric);
    return metric;
  }

  private getOrCreateDistribution(
    name: string,
    type: "timer" | "histogram",
    options: MetricOptions
  ): InMemoryDistributionMetric {
    const existing = this.metrics.get(name);
    if (existing) {
      if (existing.type !== type) {
        throw new Error(`Metric \"${name}\" is already registered as ${existing.type}`);
      }
      return existing;
    }

    const metric: InMemoryDistributionMetric = {
      type,
      description: options.description,
      values: new Map(),
    };
    this.metrics.set(name, metric);
    return metric;
  }
}
