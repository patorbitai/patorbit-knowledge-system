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
  readonly name: string;
  readonly channels: NotificationChannel[];
  send(notification: Omit<Notification, "id" | "createdAt">): Promise<string>;
}