
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type EnvConfig } from "@patorbit/config";

interface AppConfig {
  nodeEnv: "development" | "production" | "test";
  logLevel: "debug" | "info" | "warn" | "error";
  port: number;
}

interface DatabaseConfig {
  databaseUrl: string;
}

interface RedisConfig {
  redisUrl: string | undefined;
}

@Injectable()
export class TypedConfigService extends ConfigService<EnvConfig, true> {
  getAppConfig(): AppConfig {
    return {
      nodeEnv: this.get("NODE_ENV"),
      logLevel: this.get("LOG_LEVEL"),
      port: this.get("API_PORT"),
    };
  }

  getDatabaseConfig(): DatabaseConfig {
    return {
      databaseUrl: this.get("DATABASE_URL"),
    };
  }

  getRedisConfig(): RedisConfig {
    return {
      redisUrl: this.get("REDIS_URL"),
    };
  }
}
