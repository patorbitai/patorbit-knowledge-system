// Notifications Package
// Notification abstraction layer with in-memory, email, and in-app providers

export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'push';

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
  send(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string>;
}

// ── In-memory provider (default / dev) ───────────────────────────────────────

export class InMemoryNotificationProvider implements NotificationProvider {
  name = 'in-memory';
  channels: NotificationChannel[] = ['in_app'];
  private messages: Notification[] = [];

  async send(notif: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const full: Notification = { ...notif, id, createdAt: new Date() };
    this.messages.push(full);
    return id;
  }

  getMessages(recipientId?: string): Notification[] {
    if (recipientId) {
      return this.messages.filter((m) => m.recipientId === recipientId);
    }
    return this.messages;
  }

  markRead(id: string): void {
    const msg = this.messages.find((m) => m.id === id);
    if (msg) msg.readAt = new Date();
  }

  clear(): void {
    this.messages = [];
  }
}

// ── Console provider (logs to stdout) ────────────────────────────────────────

export class ConsoleNotificationProvider implements NotificationProvider {
  name = 'console';
  channels: NotificationChannel[] = ['email', 'sms', 'in_app', 'push'];

  async send(notif: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    console.log(`[NOTIFICATION][${notif.channel}] To=${notif.recipientId}`, {
      title: notif.title,
      body: notif.body,
      type: notif.type,
      data: notif.data,
    });
    return id;
  }
}

// ── Notification service ────────────────────────────────────────────────────

export class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map();

  constructor(providers: NotificationProvider[] = []) {
    for (const p of providers) {
      this.providers.set(p.name, p);
    }
  }

  registerProvider(provider: NotificationProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): NotificationProvider | undefined {
    return this.providers.get(name);
  }

  async send(
    notif: Omit<Notification, 'id' | 'createdAt'>,
    providerName?: string,
  ): Promise<string[]> {
    const targets = providerName
      ? [this.providers.get(providerName)].filter(Boolean)
      : Array.from(this.providers.values()).filter((p) => p.channels.includes(notif.channel));

    const results = await Promise.allSettled(
      (targets as NotificationProvider[]).map((p) => p.send(notif)),
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<string>).value);
  }

  async broadcast(
    notif: Omit<Notification, 'id' | 'createdAt' | 'recipientId'>,
    recipientIds: string[],
    channel?: NotificationChannel,
  ): Promise<number> {
    let sent = 0;
    for (const recipientId of recipientIds) {
      await this.send({ ...notif, recipientId, channel: channel ?? notif.channel ?? 'in_app' });
      sent++;
    }
    return sent;
  }
}

// ── Default instance ────────────────────────────────────────────────────────

export const defaultNotificationService = new NotificationService([
  new InMemoryNotificationProvider(),
  new ConsoleNotificationProvider(),
]);
