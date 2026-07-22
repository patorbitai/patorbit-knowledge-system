import { Inject, Injectable } from "@nestjs/common";

import { METRICS_PROVIDER } from "./metrics.constants";
import  {
  type BusinessMetric,
  type BusinessMetricHook,
  type Counter,
  type Histogram,
  type MetricLabels,
  type MetricOptions,
  type MetricsProvider,
  type Timer,
  type TimerStop,
} from "./metrics.provider";

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, Counter>();
  private readonly timers = new Map<string, Timer>();
  private readonly histograms = new Map<string, Histogram>();
  private readonly businessMetricHooks = new Set<BusinessMetricHook>();

  constructor(
    @Inject(METRICS_PROVIDER) private readonly provider: MetricsProvider
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  counter(name: string, options?: MetricOptions): Counter {
    let counter = this.counters.get(name);
    if (!counter) {
      counter = this.provider.createCounter(name, options);
      this.counters.set(name, counter);
    }
    return counter;
  }

  increment(
    name: string,
    value = 1,
    labels: MetricLabels = {},
    options?: MetricOptions
  ): void {
    this.counter(name, options).increment(value, labels);
  }

  decrement(
    name: string,
    value = 1,
    labels: MetricLabels = {},
    options?: MetricOptions
  ): void {
    this.counter(name, options).decrement(value, labels);
  }

  timer(name: string, options?: MetricOptions): Timer {
    let timer = this.timers.get(name);
    if (!timer) {
      timer = this.provider.createTimer(name, options);
      this.timers.set(name, timer);
    }
    return timer;
  }

  startTimer(
    name: string,
    labels: MetricLabels = {},
    options?: MetricOptions
  ): TimerStop {
    return this.timer(name, options).start(labels);
  }

  async time<T>(
    name: string,
    operation: () => T | Promise<T>,
    labels: MetricLabels = {},
    options?: MetricOptions
  ): Promise<T> {
    const stop = this.startTimer(name, labels, options);
    try {
      return await operation();
    } finally {
      stop();
    }
  }

  histogram(name: string, options?: MetricOptions): Histogram {
    let histogram = this.histograms.get(name);
    if (!histogram) {
      histogram = this.provider.createHistogram(name, options);
      this.histograms.set(name, histogram);
    }
    return histogram;
  }

  record(
    name: string,
    value: number,
    labels: MetricLabels = {},
    options?: MetricOptions
  ): void {
    this.histogram(name, options).record(value, labels);
  }

  addBusinessMetricHook(hook: BusinessMetricHook): () => void {
    this.businessMetricHooks.add(hook);
    return () => this.businessMetricHooks.delete(hook);
  }

  recordBusinessMetric(
    name: string,
    value = 1,
    labels: MetricLabels = {}
  ): void {
    const metric: BusinessMetric = {
      name,
      value,
      labels: { ...labels },
      recordedAt: new Date(),
    };

    for (const hook of this.businessMetricHooks) {
      hook(metric);
    }
  }
}
