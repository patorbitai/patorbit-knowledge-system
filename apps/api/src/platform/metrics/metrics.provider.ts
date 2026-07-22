export type MetricLabelValue = string | number | boolean;
export type MetricLabels = Record<string, MetricLabelValue>;

export interface MetricOptions {
  description?: string;
}

export interface Counter {
  increment(value?: number, labels?: MetricLabels): void;
  decrement(value?: number, labels?: MetricLabels): void;
}

export type TimerStop = (labels?: MetricLabels) => number;

export interface Timer {
  start(labels?: MetricLabels): TimerStop;
  record(durationMs: number, labels?: MetricLabels): void;
}

export interface Histogram {
  record(value: number, labels?: MetricLabels): void;
}

export interface MetricsProvider {
  readonly name: string;
  createCounter(name: string, options?: MetricOptions): Counter;
  createTimer(name: string, options?: MetricOptions): Timer;
  createHistogram(name: string, options?: MetricOptions): Histogram;
}

export interface BusinessMetric {
  name: string;
  value: number;
  labels: MetricLabels;
  recordedAt: Date;
}

export type BusinessMetricHook = (metric: BusinessMetric) => void;
