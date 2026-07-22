import { Module, DynamicModule, Provider } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { ConsoleNotificationProvider } from "./providers/console.notification-provider";
import { NOTIFICATION_PROVIDER } from "./notifications.constants";

export type NotificationProviderType = "console";

export interface NotificationsModuleOptions {
  provider: NotificationProviderType;
}

@Module({})
export class NotificationsModule {
  static forRoot(_options?: NotificationsModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: NOTIFICATION_PROVIDER,
        useClass: ConsoleNotificationProvider,
      },
      NotificationsService,
    ];

    return {
      module: NotificationsModule,
      global: true,
      providers,
      exports: [NotificationsService],
    };
  }
}