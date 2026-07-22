import { Injectable, Logger } from "@nestjs/common";

import { type Email, type EmailAddress,type EmailProvider } from "../email.provider";

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);
  readonly name = "console";

  private formatAddress(address: EmailAddress | EmailAddress[]): string {
    const addresses = Array.isArray(address) ? address : [address];
    return addresses.map((a) => (a.name ? `${a.name} <${a.address}>` : a.address)).join(", ");
  }

  async send(email: Email): Promise<string> {
    const id = crypto.randomUUID();
    this.logger.log("────────────────── New Email ───────────────────");
    this.logger.log(`Email ID  : ${id}`);
    this.logger.log(`From      : ${this.formatAddress(email.from)}`);
    this.logger.log(`To        : ${this.formatAddress(email.to)}`);
    if (email.cc) this.logger.log(`Cc        : ${this.formatAddress(email.cc)}`);
    if (email.bcc) this.logger.log(`Bcc       : ${this.formatAddress(email.bcc)}`);
    if (email.replyTo) this.logger.log(`Reply-To  : ${this.formatAddress(email.replyTo)}`);
    this.logger.log(`Subject   : ${email.subject}`);
    this.logger.log("--- Text Body ----------------------------------");
    this.logger.log(email.text);
    this.logger.log("--- HTML Body ----------------------------------");
    this.logger.log(email.html);
    this.logger.log("───────────────────────────────────────────────");
    return id;
  }
}