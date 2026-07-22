import { type DynamicModule, Module, type Provider } from "@nestjs/common";

import { NOTIFICATION_PROVIDER } from "./notifications.constants";
import { NotificationsService } from "./notifications.service";
import { ConsoleNotificationProvider } from "./providers/console.notification-provider";

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