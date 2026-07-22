import { Inject, Injectable, Optional, Scope } from "@nestjs/common";
import { INQUIRER } from "@nestjs/core";
import { type PinoLogger } from "nestjs-pino";

export type LogMetadata = Record<string, unknown>;

@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService {
  private readonly defaultContext: string;

  constructor(
    private readonly logger: PinoLogger,
    @Optional() @Inject(INQUIRER) parent?: object,
  ) {
    this.defaultContext = parent?.constructor?.name ?? LoggingService.name;
  }

  log(message: string, metadata: LogMetadata = {}, context?: string): void {
    this.logger.info(this.fields(metadata, context), message);
  }

  error(
    message: string,
    error?: unknown,
    metadata: LogMetadata = {},
    context?: string,
  ): void {
    this.logger.error(
      {
        ...metadata,
        err: this.normalizeError(error),
        context: context ?? this.defaultContext,
      },
      message,
    );
  }

  warn(message: string, metadata: LogMetadata = {}, context?: string): void {
    this.logger.warn(this.fields(metadata, context), message);
  }

  debug(message: string, metadata: LogMetadata = {}, context?: string): void {
    this.logger.debug(this.fields(metadata, context), message);
  }

  private fields(metadata: LogMetadata, context?: string): LogMetadata {
    return {
      ...metadata,
      context: context ?? this.defaultContext,
    };
  }

  private normalizeError(error: unknown): unknown {
    if (error === undefined || error instanceof Error) {
      return error;
    }

    return new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
}
