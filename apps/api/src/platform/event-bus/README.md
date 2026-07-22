# Event Bus Platform Module

This module provides a flexible and robust event bus implementation for a NestJS application, built with enterprise patterns in mind. It facilitates communication between different parts of the application through events, promoting loose coupling and separation of concerns.

## Features

-   **Publish/Subscribe:** Broadcast events and have multiple handlers react to them.
-   **Outbox Pattern:** Ensures at-least-once event delivery by persisting events before publishing. This is crucial for maintaining data consistency in distributed systems.
-   **Dead Letter Queue (DLQ):** Failed events are moved to a DLQ after several retries, preventing them from being lost and allowing for manual inspection or reprocessing.
-   **Automatic Retries:** Event handlers that fail are automatically retried with configurable backoff strategies.
-   **Handler Timeouts:** Prevents long-running handlers from blocking the system.
-   **Configurable:** Easily enable or disable features like the outbox and dead letter queue through module options.
-   **Dependency Injection:** Seamlessly integrates with the NestJS DI container.

## Usage

### 1. Importing the Module

Import `EventBusModule` into your root `AppModule`:

```typescript
import { Module } from "@nestjs/common";
import { EventBusModule } from "./platform/event-bus";

@Module({
  imports: [
    EventBusModule.forRoot({
      enableOutbox: true,
      enableDeadLetter: true,
      maxRetries: 3,
      retryDelay: 1000,
    }),
  ],
})
export class AppModule {}
```

### 2. Defining Events

Events are simple classes or interfaces that extend `DomainEvent` or `ApplicationEvent`.

```typescript
import { DomainEvent } from "./platform/event-bus";

export class UserCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = "UserCreatedEvent";
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly version: number;

  constructor(
    public readonly payload: { userId: string; email: string },
    aggregateId: string,
  ) {
    this.eventId = crypto.randomUUID();
    this.timestamp = new Date();
    this.aggregateId = aggregateId;
    this.version = 1;
  }
}
```

### 3. Creating Event Handlers

Event handlers are services that implement the `IEventHandler` interface and use the `@EventHandler` decorator.

```typescript
import { Injectable } from "@nestjs/common";
import { EventHandler, IEventHandler } from "./platform/event-bus";
import { UserCreatedEvent } from "../users/events/user-created.event";

@Injectable()
@EventHandler(UserCreatedEvent)
export class SendWelcomeEmailHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    console.log(`Sending welcome email to ${event.payload.email}`);
    // Email sending logic...
  }
}
```

Make sure to register the handler as a provider in a module.

### 4. Publishing Events

Inject the `EventBusService` and use the `publish` method.

```typescript
import { Injectable, Inject } from "@nestjs/common";
import { EVENT_BUS, IEventBus } from "./platform/event-bus";
import { UserCreatedEvent } from "../users/events/user-created.event";

@Injectable()
export class UserService {
  constructor(@Inject(EVENT_BUS) private readonly eventBus: IEventBus) {}

  async createUser(email: string): Promise<void> {
    const userId = "some-user-id";
    // User creation logic...

    const event = new UserCreatedEvent({ userId, email }, userId);
    await this.eventBus.publish(event);
  }
}
```

## Configuration

The `EventBusModule.forRoot()` method accepts an options object:

-   `enableEvents` (boolean): Master switch for the event bus. Default: `true`.
-   `enableOutbox` (boolean): Enable the outbox pattern. Events are stored before dispatch. Default: `true`.
-   `enableDeadLetter` (boolean): Enable the dead letter queue for failed events. Default: `true`.
-   `maxRetries` (number): Max number of retries for a failing handler. Default: `3`.
-   `retryDelay` (number): Initial delay in ms for retries. Default: `1000`.
-   `handlerTimeout` (number): Timeout in ms for a handler to execute. Default: `30000`.

The current implementation uses in-memory providers for the outbox and dead letter queue. For production use, these should be replaced with persistent storage solutions (e.g., a database-backed provider). This can be achieved by providing custom implementations for the `OUTBOX_SERVICE` and `DEAD_LETTER_SERVICE` tokens.
