# Configuration Module

The `ConfigurationModule` provides strongly typed, validated access to environment variables. It uses `@nestjs/config` for environment loading and Zod for validation.

## Usage

The module is global. It exports `TypedConfigService` and three `Provider` symbols for type-safe slices of the application configuration:

- `TypedConfigService`: a `ConfigService` subclass for full access to the validated environment.
- `APP_CONFIG`: `{ nodeEnv, logLevel, port }`
- `DATABASE_CONFIG`: `{ databaseUrl }`
- `REDIS_CONFIG`: `{ redisUrl }`

Inject a config slice via its `@Inject(TOKEN)` decorator:

```typescript
import { Inject } from '@nestjs/common';
import { APP_CONFIG } from '@platform/config';

@Injectable()
export class MyService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  log() {
    console.log(`Running in ${this.config.nodeEnv}`);
  }
}
```
