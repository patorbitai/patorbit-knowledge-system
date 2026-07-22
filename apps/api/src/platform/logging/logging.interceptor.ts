import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";
import { LoggingService } from "./logging.service";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();
    const logContext = `${context.getClass().name}.${context.getHandler().name}`;
    const requestMetadata = {
      correlationId: request.id,
      method: request.method,
      path: request.originalUrl ?? request.url,
    };

    this.logger.log(
      "Request started",
      { event: "request.started", ...requestMetadata },
      logContext,
    );

    return next.handle().pipe(
      tap({
        complete: () => {
          this.logger.log(
            "Request completed",
            {
              event: "request.completed",
              ...requestMetadata,
              statusCode: response.statusCode,
              durationMs: this.elapsedMilliseconds(startedAt),
            },
            logContext,
          );
        },
        error: (error: unknown) => {
          this.logger.error(
            "Request failed",
            error,
            {
              event: "request.failed",
              ...requestMetadata,
              statusCode: this.statusCode(error, response),
              durationMs: this.elapsedMilliseconds(startedAt),
            },
            logContext,
          );
        },
      }),
    );
  }

  private elapsedMilliseconds(startedAt: bigint): number {
    const elapsed = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    return Number(elapsed.toFixed(3));
  }

  private statusCode(error: unknown, response: Response): number {
    if (
      typeof error === "object" &&
      error !== null &&
      "getStatus" in error &&
      typeof error.getStatus === "function"
    ) {
      return error.getStatus();
    }

    return response.statusCode >= 400 ? response.statusCode : 500;
  }
}
