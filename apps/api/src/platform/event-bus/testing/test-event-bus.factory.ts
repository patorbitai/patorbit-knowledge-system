import { type DiscoveryService } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EVENT_BUS_DISPATCH_TOPIC } from '../event-bus.constants';
import { EventBusService } from '../event-bus.service';
import { DeadLetterService } from '../services/dead-letter.service';
import { OutboxService } from '../services/outbox.service';
import { RetryService } from '../services/retry.service';

export function createTestEventBus(
  options: any = {},
  handlerClasses: any[] = [],
  instances: Map<any, any> = new Map(),
) {
  // Simple fake discovery service that returns provider wrappers the production code expects
  const providers = handlerClasses.map((cls) => ({
    metatype: cls,
    instance: instances.get(cls) ?? null,
  }));
  const discovery: DiscoveryService = {
    getProviders: () => providers as any,
  } as unknown as DiscoveryService;

  const emitter = new EventEmitter2();
  const outbox = new OutboxService();
  const deadLetter = new DeadLetterService();
  const retry = new RetryService();

  const service = new EventBusService(options, discovery, emitter, outbox, deadLetter, retry);

  // Emulate Nest's @OnEvent wiring for the internal dispatch topic.
  emitter.on(EVENT_BUS_DISPATCH_TOPIC, (event: any) =>
    (service as unknown as { onDispatch: (event: any) => Promise<void> }).onDispatch(event),
  );

  return { service, emitter, discovery, outbox, deadLetter, retry, providers, instances };
}
