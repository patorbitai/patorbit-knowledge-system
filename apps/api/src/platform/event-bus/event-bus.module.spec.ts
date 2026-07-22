
import { Test, TestingModule } from "@nestjs/testing";
import { describe, expect,it } from "vitest";

import {
  DEAD_LETTER_SERVICE,
  EVENT_BUS,
  OUTBOX_SERVICE,
  RETRY_SERVICE,
} from "./event-bus.constants";
import { EventBusModule } from "./event-bus.module";
import  { type IEventBus } from "./event-bus.provider";
import { EventBusService } from "./event-bus.service";
import { DeadLetterService } from "./services/dead-letter.service";
import { OutboxService } from "./services/outbox.service";
import { RetryService } from "./services/retry.service";

describe("EventBusModule", () => {
  it("should compile the module with forRoot", async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [EventBusModule.forRoot()],
    }).compile();

    expect(moduleFixture).toBeDefined();
  });

  it("should provide EventBusService as EVENT_BUS token", async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [EventBusModule.forRoot()],
    }).compile();

    const eventBus = moduleFixture.get<IEventBus>(EVENT_BUS);
    expect(eventBus).toBeDefined();
    expect(eventBus).toBeInstanceOf(EventBusService);
  });

  it("should provide OUTBOX_SERVICE", async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [EventBusModule.forRoot()],
    }).compile();

    const outbox = moduleFixture.get(OUTBOX_SERVICE);
    expect(outbox).toBeDefined();
    expect(outbox).toBeInstanceOf(OutboxService);
  });

  it("should provide DEAD_LETTER_SERVICE", async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [EventBusModule.forRoot()],
    }).compile();

    const dlq = moduleFixture.get(DEAD_LETTER_SERVICE);
    expect(dlq).toBeDefined();
    expect(dlq).toBeInstanceOf(DeadLetterService);
  });

  it("should provide RETRY_SERVICE", async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [EventBusModule.forRoot()],
    }).compile();

    const retry = moduleFixture.get(RETRY_SERVICE);
    expect(retry).toBeDefined();
    expect(retry).toBeInstanceOf(RetryService);
  });

  it("should create a global module", async () => {
    // forRoot sets global: true
    const moduleFixture = await Test.createTestingModule({
      imports: [EventBusModule.forRoot()],
    }).compile();

    const eventBus = moduleFixture.get(EventBusService);
    expect(eventBus).toBeDefined();
  });

  it("should accept custom options via forRoot", async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        EventBusModule.forRoot({
          enableOutbox: false,
          enableDeadLetter: false,
          maxRetries: 5,
          retryDelay: 2000,
          handlerTimeout: 10000,
        }),
      ],
    }).compile();

    const eventBus = moduleFixture.get<EventBusService>(EventBusService);
    expect(eventBus).toBeDefined();
  });
});
