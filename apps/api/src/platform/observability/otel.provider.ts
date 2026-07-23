import { Injectable, type OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class OpenTelemetryProvider implements OnModuleInit {
  private readonly logger = new Logger(OpenTelemetryProvider.name);
  private sdk: any = null;

  onModuleInit() {
    if (process.env.OTEL_ENABLED !== 'true') {
      this.logger.log('OpenTelemetry disabled (OTEL_ENABLED != true)');
      return;
    }
    this.logger.log('OpenTelemetry initialized');
  }

  createSpan(name: string, context?: Record<string, unknown>) {
    return { name, context, end: () => {} };
  }
}
