import { Inject, Injectable } from "@nestjs/common";

import { NOTIFICATION_PROVIDER } from "./notifications.constants";
import { type Notification, type NotificationProvider, type NotificationChannel } from "./notifications.provider";

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_PROVIDER)
    private readonly provider: NotificationProvider
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  get supportedChannels(): NotificationChannel[] {
    return this.provider.channels;
  }

  async send(
    notification: Omit<Notification, "id" | "createdAt">
  ): Promise<string> {
    return this.provider.send(notification);
  }
}
