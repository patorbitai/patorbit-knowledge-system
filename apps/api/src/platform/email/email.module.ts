import { type DynamicModule, Module, type Provider } from "@nestjs/common";

import { EMAIL_PROVIDER, EMAIL_QUEUE } from "./email.constants";
import { EmailService } from "./email.service";
import { EmailQueueService } from "./email-queue.service";
import { InMemoryQueue } from "./in-memory-queue.service";
import { ConsoleEmailProvider } from "./providers/console.email-provider";

export type EmailProviderType = "console"; // | "sendgrid" | "smtp";
export type EmailQueueType = "memory"; // | "redis";

export interface EmailModuleOptions {
  provider: EmailProviderType;
  queue: EmailQueueType;
}

@Module({})
export class EmailModule {
  static forRoot(_options?: EmailModuleOptions): DynamicModule {
    const emailProvider: Provider = {
      provide: EMAIL_PROVIDER,
      useClass: ConsoleEmailProvider,
    };

    const queueProvider: Provider = {
      provide: EMAIL_QUEUE,
      useClass: InMemoryQueue,
    };

    return {
      module: EmailModule,
      global: true,
      providers: [emailProvider, queueProvider, EmailQueueService, EmailService],
      exports: [EmailService, EmailQueueService],
    };
  }
}
