import {
  BullModule,
  getQueueToken as getBullQueueToken,
} from "@nestjs/bullmq";
import {
  type DynamicModule,
  Global,
  Module,
  type Provider,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Queue as BullQueue } from "bullmq";

import { getJobQueueToken,JOB_QUEUES } from "./jobs.constants";
import { type JobQueue } from "./jobs.provider";
import { JobsService } from "./jobs.service";
import { BullMQQueue } from "./queue/bull.queue";
import { InMemoryQueue } from "./queue/in-memory.queue";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type JobsProviderType = "bullmq" | "memory" | "auto";

export interface JobQueueRegistration {
  name: string;
  provider?: JobsProviderType;
}

export interface JobsModuleOptions {
  queues?: JobQueueRegistration[];
  redisUrl?: string;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Global()
@Module({})
export class JobsModule {
  /**
   * Register one or more job queues.
   *
   * Each registered queue gets a named `JobQueue` token (`getJobQueueToken(name)`)
   * and is also collected into a single `Map<string, JobQueue>` that backs
   * `JobsService`.
   *
   * When any queue opts for `"bullmq"` the module auto-configures
   * `BullModule.forRootAsync` so Redis is wired up automatically from
   * the `REDIS_URL` environment variable or explicit `config` input.
   */
  static forRoot(options?: JobsModuleOptions): DynamicModule {
    const queues: JobQueueRegistration[] = options?.queues ?? [
      { name: "default", provider: "memory" },
    ];

    const useBullMQ = queues.some((q) => q.provider !== "memory");
    const haveRedis =
      !!options?.redisUrl || !!process.env.REDIS_URL;

    const imports: DynamicModule[] = [];
    const providers: Provider[] = [];
    const queueInstances: JobQueue[] = [];

    // ---- BullMQ root config (once) -----------------------------------
    if (useBullMQ && haveRedis) {
      imports.push(
        BullModule.forRootAsync({
          useFactory: (configService: ConfigService) => {
            const redisUrl =
              options?.redisUrl ??
              configService.getOrThrow<string>("REDIS_URL");
            const parsed = new URL(redisUrl);
            return {
              connection: {
                host: parsed.hostname || "localhost",
                port: Number(parsed.port) || 6379,
                password: parsed.password || undefined,
              },
              defaultJobOptions: {
                removeOnComplete: { age: 3600, count: 100 },
                removeOnFail: { age: 86400, count: 1000 },
              },
            };
          },
          inject: [ConfigService],
        }),
      );
    }

    // ---- Per-queue registration --------------------------------------
    for (const q of queues) {
      const useBull = q.provider === "bullmq";
      const queueToken = getJobQueueToken(q.name);

      if (useBull) {
        imports.push(BullModule.registerQueue({ name: q.name }));

        providers.push({
          provide: queueToken,
          useFactory: (bullQueue: BullQueue) => {
            const instance = new BullMQQueue(bullQueue);
            queueInstances.push(instance);
            return instance;
          },
          inject: [getBullQueueToken(q.name)],
        });
      } else {
        providers.push({
          provide: queueToken,
          useFactory: () => {
            const instance = new InMemoryQueue(q.name);
            queueInstances.push(instance);
            return instance;
          },
        });
      }
    }

    // ---- Inject the shared queue map into JobsService -----------------
    const queueTokens = queues.map((q) => getJobQueueToken(q.name));
    providers.push({
      provide: JOB_QUEUES,
      useFactory: (...instances: JobQueue[]) =>
        new Map(instances.map((instance) => [instance.name, instance])),
      inject: queueTokens,
    });

    providers.push(JobsService);

    const exportsArr = [JOB_QUEUES, JobsService, ...queues.map((q) => getJobQueueToken(q.name))];

    return {
      module: JobsModule,
      imports,
      providers,
      exports: exportsArr,
    };
  }
}
