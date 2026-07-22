import { Global,Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard,ThrottlerModule } from "@nestjs/throttler";

import { RateLimitGuard } from "./rate-limit.guard";

export interface RateLimitingModuleOptions {
  ttl?: number;
  limit?: number;
}

@Global()
@Module({})
export class RateLimitingModule {
  static forRoot(options?: RateLimitingModuleOptions): ReturnType<typeof ThrottlerModule.forRoot> {
    return {
      module: RateLimitingModule,
      global: true,
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: options?.ttl ?? 60000,
            limit: options?.limit ?? 10,
          },
        ]),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: RateLimitGuard,
        },
      ],
      exports: [ThrottlerModule],
    } as any;
  }
}