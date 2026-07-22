import { Injectable, Logger } from "@nestjs/common";
import type { Notification, NotificationChannel } from "@patorbit/notifications";
import type { NotificationProvider } from "../notifications.provider";

@Injectable()
export class ConsoleNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ConsoleNotificationProvider.name);
  readonly name = "console";
  readonly channels: NotificationChannel[] = ["in_app"];

  async send(
    notification: Omit<Notification, "id" | "createdAt">
  ): Promise<string> {
    const id = crypto.randomUUID();
    this.logger.log("────────────────────────────────────────");
    this.logger.log(`Notification ID : ${id}`);
    this.logger.log(`Type           : ${notification.type}`);
    this.logger.log(`Recipient      : ${notification.recipientId}`);
    this.logger.log(`Channel        : ${notification.channel}`);
    this.logger.log(`Title          : ${notification.title}`);
    this.logger.log(`Body           : ${notification.body}`);
    if (notification.data) {
      this.logger.log(`Data           : ${JSON.stringify(notification.data)}`);
    }
    this.logger.log("────────────────────────────────────────");
    return id;
  }
}