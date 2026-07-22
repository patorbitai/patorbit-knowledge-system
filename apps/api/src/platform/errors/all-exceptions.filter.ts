import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  type HttpAdapterHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import { type LoggingService } from '../logging/logging.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: LoggingService,
  ) {
    // setContext not available on this LoggingService
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      method: httpAdapter.getRequestMethod(request),
      correlationId: request.id,
      message: (exception as any).message ?? 'Internal server error',
    };

    this.logger.error('Unhandled exception', (exception as Error).stack, {
      exception,
      ...responseBody,
    });

    httpAdapter.reply(response, responseBody, status);
  }
}
