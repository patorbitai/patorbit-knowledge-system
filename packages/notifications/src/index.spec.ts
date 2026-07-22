import { beforeEach, describe, expect, it } from 'vitest';

import {
  ConsoleNotificationProvider,
  InMemoryNotificationProvider,
  NotificationService,
} from './index';

describe('NotificationService', () => {
  let inMemoryProvider: InMemoryNotificationProvider;
  let service: NotificationService;

  beforeEach(() => {
    inMemoryProvider = new InMemoryNotificationProvider();
    service = new NotificationService([inMemoryProvider, new ConsoleNotificationProvider()]);
  });

  it('should send a notification to the in-app provider', async () => {
    const ids = await service.send({
      channel: 'in_app',
      recipientId: 'user1',
      title: 'Test',
      body: 'This is a test',
      type: 'test.event',
    });
    expect(ids).toHaveLength(2);
    const messages = inMemoryProvider.getMessages('user1');
    expect(messages).toHaveLength(1);
    expect(messages[0].title).toBe('Test');
  });

  it('should broadcast to multiple users', async () => {
    const count = await service.broadcast(
      {
        channel: 'in_app',
        title: 'Broadcast',
        body: 'This is a broadcast',
        type: 'broadcast.event',
      },
      ['user1', 'user2', 'user3'],
    );
    expect(count).toBe(3);
    expect(inMemoryProvider.getMessages('user1')).toHaveLength(1);
    expect(inMemoryProvider.getMessages('user2')).toHaveLength(1);
    expect(inMemoryProvider.getMessages('user3')).toHaveLength(1);
  });
});
