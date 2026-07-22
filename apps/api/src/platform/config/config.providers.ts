
import { type Provider } from "@nestjs/common";

import { APP_CONFIG, DATABASE_CONFIG, REDIS_CONFIG } from "./config.constants";
import { TypedConfigService } from "./typed-config.service";

export const appConfigProvider: Provider = {
  provide: APP_CONFIG,
  useFactory: (configService: TypedConfigService) => configService.getAppConfig(),
  inject: [TypedConfigService],
};

export const databaseConfigProvider: Provider = {
  provide: DATABASE_CONFIG,
  useFactory: (configService: TypedConfigService) =>
    configService.getDatabaseConfig(),
  inject: [TypedConfigService],
};

export const redisConfigProvider: Provider = {
  provide: REDIS_CONFIG,
  useFactory: (configService: TypedConfigService) => configService.getRedisConfig(),
  inject: [TypedConfigService],
};
