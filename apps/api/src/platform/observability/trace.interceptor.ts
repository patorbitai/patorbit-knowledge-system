import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { type Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest();
    const { method, path } = req;
    const correlationId = req.headers['x-correlation-id'] || uuid();
    req.correlationId = correlationId;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (value) => {
          const duration = Date.now() - start;
          this.logger.info(`${method} ${path}`, {
            correlationId,
            durationMs: duration,
            httpMethod: method,
            path,
            statusCode: context.switchToHttp().getResponse().statusCode,
          });
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(`${method} ${path} failed`, error instanceof Error ? error : new Error(String(error)), {
            correlationId,
            durationMs: duration,
            httpMethod: method,
            path,
          });
        },
      }),
    );
  }
}
