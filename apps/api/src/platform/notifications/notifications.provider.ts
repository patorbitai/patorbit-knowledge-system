import  { type Notification, type NotificationChannel } from "@patorbit/notifications";

export interface NotificationProvider {
  readonly name: string;
  readonly channels: NotificationChannel[];
  send(notification: Omit<Notification, "id" | "createdAt">): Promise<string>;
}