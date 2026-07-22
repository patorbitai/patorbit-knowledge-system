# Jobs Platform Module

This module provides a unified interface for job queue processing, supporting both BullMQ (Redis-based) and in-memory queue implementations.

## Purpose

- **Standardized job interface** across different queue backends (`JobQueue`).
- **Flexible configuration** for both production (`"bullmq"`) and development (`"memory"`) environments.
- **Unified `JobsService`** for interacting with multiple independent queues.
- **Automatic retry mechanisms** with configurable backoff strategies.
- **Decoupled job processing** via `JobsService.process()` registration.

## Usage

### Module Registration

Register queues in your application's root module (e.g. `AppModule`).

```typescript
// app.module.ts
import { JobsModule } from '@platform/jobs';

@Module({
  imports: [
    JobsModule.forRoot({
      queues: [
        { name: 'default', provider: 'memory' },
        { name: 'email', provider: 'bullmq' },
      ],
      redisUrl: process.env.REDIS_URL,
    }),
  ],
})
export class AppModule {}
```

**Configuration Options:**

- `queues`: An array of `JobQueueRegistration` objects.
  - `name`: The unique name for the queue.
  - `provider`: `"bullmq"` or `"memory"` (defaults to `"memory"`).
- `redisUrl`: Redis connection string, used when any queue is a `"bullmq"` provider. Defaults to `redis://localhost:6379`.

### Adding Jobs

Inject `JobsService` and add jobs to a named queue.

```typescript
import { JobsService } from '@platform/jobs';

@Injectable()
export class NotificationService {
  constructor(private readonly jobs: JobsService) {}

  async sendEmail(to: string, message: string) {
    await this.jobs.add('email', 'send', { to, message }, { attempts: 3 });
  }
}
```

### Processing Jobs

Register a worker function to process jobs from a queue. This is typically done in a service's `onModuleInit`.

```typescript
import { JobsService, type Job } from '@platform/jobs';

@Injectable()
export class EmailWorker implements OnModuleInit {
  constructor(private readonly jobs: JobsService) {}

  onModuleInit() {
    this.jobs.process('email', this.handle.bind(this));
  }

  private async handle(job: Job<{ to: string; message: string }>) {
    // send the email...
  }
}
```

### Job Status & Lookup

Retrieve a job or check its status by ID.

```typescript
const job = await this.jobs.getJob('email', 'job-123');
const status = await this.jobs.getJobStatus('email', 'job-123'); // "completed", "failed", etc.
```

## API

- **`JobsService.add(queue, name, data, options)`**: Enqueue a new job.
- **`JobsService.getJob(queue, id)`**: Retrieve a job instance.
- **`JobsService.getJobStatus(queue, id)`**: Get a job's status.
- **`JobsService.process(queue, worker, options)`**: Register a worker.

The API does not currently expose methods for job cancellation or manual retry.

## Testing

Tests for services that interact with jobs can mock `JobsService`. For integration tests, use an in-memory queue provider.

```bash
# Run all tests in the platform/jobs directory
pnpm -F @patorbit/api test -- src/platform/jobs
```
