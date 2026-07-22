import { DynamicModule, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { ConfigurationModule, TypedConfigService } from "../config";
import { resolveCorrelationId } from "./correlation-id";
import { LoggingInterceptor } from "./logging.interceptor";
import { LoggingService } from "./logging.service";

@Module({})
export class LoggingModule {
  static forRoot(): DynamicModule {
    return {
      module: LoggingModule,
      global: true,
      imports: [
        PinoLoggerModule.forRootAsync({
          imports: [ConfigurationModule],
          inject: [TypedConfigService],
          useFactory: (configService: TypedConfigService) => {
            const { logLevel, nodeEnv } = configService.getAppConfig();

            return {
              pinoHttp: {
                level: logLevel,
                autoLogging: false,
                base: {
                  service: "patorbit-api",
                  environment: nodeEnv,
                },
                genReqId: resolveCorrelationId,
                customProps: (request) => ({
                  correlationId: request.id,
                }),
                redact: {
                  paths: [
                    "req.headers.authorization",
                    "req.headers.cookie",
                    "req.body.password",
                    "req.body.token",
                  ],
                  censor: "[REDACTED]",
                },
              },
            };
          },
        }),
      ],
      providers: [
        LoggingService,
        LoggingInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useExisting: LoggingInterceptor,
        },
      ],
      exports: [PinoLoggerModule, LoggingService],
    };
  }
}
