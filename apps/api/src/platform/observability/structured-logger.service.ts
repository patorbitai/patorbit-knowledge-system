import { Injectable, type OnModuleInit, Logger } from '@nestjs/common';

export interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  correlationId?: string;
  userId?: string;
  organizationId?: string;
  durationMs?: number;
  error?: { message: string; stack?: string };
  [key: string]: unknown;
}

@Injectable()
export class StructuredLoggerService implements OnModuleInit {
  private readonly logger = new Logger(StructuredLoggerService.name);
  private readonly service: string = process.env.SERVICE_NAME ?? 'pks-api';

  onModuleInit() {
    this.logger.log(`Structured logging initialized for service: ${this.service}`);
  }

  info(message: string, meta?: Partial<StructuredLogEntry>) {
    this.emit('info', message, meta);
  }

  warn(message: string, meta?: Partial<StructuredLogEntry>) {
    this.emit('warn', message, meta);
  }

  error(message: string, error?: Error, meta?: Partial<StructuredLogEntry>) {
    this.emit('error', message, { ...meta, error: error ? { message: error.message, stack: error.stack } : undefined });
  }

  debug(message: string, meta?: Partial<StructuredLogEntry>) {
    if (process.env.NODE_ENV !== 'production') {
      this.emit('debug', message, meta);
    }
  }

  private emit(level: string, message: string, meta?: Partial<StructuredLogEntry>) {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...meta,
    };

    const output = JSON.stringify(entry);

    // In production, write to stdout for log aggregator (e.g. CloudWatch, Loki, Datadog)
    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }
}
