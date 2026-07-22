// Notifications Package
// Notification abstraction layer
// Provides interfaces for sending notifications across channels

export type NotificationChannel = "email" | "sms" | "in_app" | "push";

export interface Notification {
  id: string;
  type: string;
  recipientId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
}

export interface NotificationProvider {
  name: string;
  channels: NotificationChannel[];
  send(notification: Omit<Notification, "id" | "createdAt">): Promise<string>;
}
