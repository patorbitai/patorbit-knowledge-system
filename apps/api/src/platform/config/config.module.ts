
import { Global,Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { envSchema } from "@patorbit/config";

import {
  appConfigProvider,
  databaseConfigProvider,
  redisConfigProvider,
} from "./config.providers";
import { TypedConfigService } from "./typed-config.service";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        const result = envSchema.safeParse(env);
        if (!result.success) {
          const errors = result.error.flatten().fieldErrors;
          throw new Error(
            `Environment validation failed: ${JSON.stringify(errors, null, 2)}`
          );
        }
        return result.data;
      },
    }),
  ],
  providers: [
    TypedConfigService,
    appConfigProvider,
    databaseConfigProvider,
    redisConfigProvider,
  ],
  exports: [
    TypedConfigService,
    appConfigProvider,
    databaseConfigProvider,
    redisConfigProvider,
  ],
})
export class ConfigurationModule {}
