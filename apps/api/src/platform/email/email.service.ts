import { Inject, Injectable, Logger,type OnModuleInit } from "@nestjs/common";

import { EMAIL_PROVIDER, EMAIL_QUEUE } from "./email.constants";
import  { type Email, type EmailProvider } from "./email.provider";
import  { type Queue } from "./email-queue.service";
import { type EmailQueueService } from "./email-queue.service";

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly queueService: EmailQueueService,
    @Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider,
    @Inject(EMAIL_QUEUE) private readonly queue: Queue<Email>
  ) {}

  onModuleInit(): void {
    this.logger.log(`Initializing email processing with provider: ${this.provider.name}`);
    this.queue.process(this.sendEmail.bind(this));
  }

  private async sendEmail(email: Email): Promise<void> {
    try {
      const id = await this.provider.send(email);
      this.logger.log(`Successfully sent email with ID: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  async queueEmail(email: Email): Promise<void> {
    return this.queueService.send(email);
  }
}