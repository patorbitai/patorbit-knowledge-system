import { Inject, Injectable, Logger } from "@nestjs/common";

import { EMAIL_QUEUE } from "./email.constants";
import  { type Email } from "./email.provider";

export interface Queue<T> {
  add(job: T): Promise<void>;
  process(handler: (job: T) => Promise<void>): void;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@Inject(EMAIL_QUEUE) private readonly queue: Queue<Email>) {}

  async send(email: Email): Promise<void> {
    await this.queue.add(email);
    this.logger.log(`Queued email to "${email.to}" with subject "${email.subject}"`);
  }
}