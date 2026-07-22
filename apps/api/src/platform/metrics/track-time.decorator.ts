import { SetMetadata } from "@nestjs/common";
import { TRACK_TIME_METADATA } from "./metrics.constants";

/**
 * Records the execution duration of a controller method through MetricsInterceptor.
 * An explicit metric name can be supplied to keep domain timings separate.
 */
export const TrackTime = (metricName?: string): MethodDecorator =>
  SetMetadata(TRACK_TIME_METADATA, metricName ?? true);
