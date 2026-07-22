
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
      validate: (env) => envSchema.parse(env),
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
