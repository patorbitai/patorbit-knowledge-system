import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { type Reflector } from "@nestjs/core";
import  { type Request, type Response } from "express";
import  { type Observable } from "rxjs";
import { finalize } from "rxjs/operators";

import {
  HTTP_REQUEST_DURATION_MS,
  HTTP_REQUESTS_TOTAL,
  METHOD_DURATION_MS,
  TRACK_TIME_METADATA,
} from "../metrics.constants";
import  { type MetricLabels, type TimerStop } from "../metrics.provider";
import { type MetricsService } from "../metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metrics: MetricsService,
    private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const trackedMetric = this.reflector.get<string | true | undefined>(
      TRACK_TIME_METADATA,
      context.getHandler()
    );
    const stopMethodTimer = trackedMetric
      ? this.startMethodTimer(context, trackedMetric)
      : undefined;

    if (context.getType() !== "http") {
      return next.handle().pipe(finalize(() => stopMethodTimer?.()));
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const route = request.route?.path
      ? `${request.baseUrl ?? ""}${String(request.route.path)}`
      : request.path;
    const baseLabels: MetricLabels = {
      method: request.method,
      route,
    };
    const stopRequestTimer = this.metrics.startTimer(
      HTTP_REQUEST_DURATION_MS,
      baseLabels,
      { description: "HTTP request duration in milliseconds" }
    );

    return next.handle().pipe(
      finalize(() => {
        const resultLabels: MetricLabels = {
          ...baseLabels,
          status: response.statusCode,
        };
        this.metrics.increment(HTTP_REQUESTS_TOTAL, 1, resultLabels, {
          description: "Total number of HTTP requests",
        });
        stopRequestTimer({ status: response.statusCode });
        stopMethodTimer?.();
      })
    );
  }

  private startMethodTimer(
    context: ExecutionContext,
    trackedMetric: string | true
  ): TimerStop {
    const labels: MetricLabels = {
      controller: context.getClass().name,
      handler: context.getHandler().name,
    };
    const metricName =
      typeof trackedMetric === "string" ? trackedMetric : METHOD_DURATION_MS;

    return this.metrics.startTimer(metricName, labels, {
      description: "Decorated method execution duration in milliseconds",
    });
  }
}
