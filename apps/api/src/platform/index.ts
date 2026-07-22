export { PlatformModule, type PlatformConfig } from "./platform.module";

export {
  StorageModule,
  StorageService,
  type StorageModuleOptions,
  type StorageProviderType,
} from "./storage";

export {
  NotificationsModule,
  NotificationsService,
  type NotificationsModuleOptions,
  type NotificationProviderType,
} from "./notifications";

export {
  EmailModule,
  EmailService,
  EmailQueueService,
  type EmailModuleOptions,
  type EmailProviderType,
  type EmailQueueType,
  type Email,
  type EmailAddress,
  type EmailProvider,
} from "./email";

export {
  PlatformCacheModule,
  CacheService,
  type CacheModuleOptions,
} from "./cache";

export {
  SearchModule,
  SearchService,
  type SearchModuleOptions,
  type SearchProviderType,
  type SearchProvider,
  type SearchDocument,
  type SearchQuery,
  type SearchResponse,
  type SearchResult,
} from "./search";

export {
  GraphModule,
  GraphService,
  type GraphModuleOptions,
  type GraphProviderType,
  type GraphProvider,
  type GraphNode,
  type GraphEdge,
  type GraphQueryResult,
} from "./graph";

export {
  MetricsModule,
  MetricsService,
  TrackTime,
  type MetricsModuleOptions,
  type MetricsProviderType,
  type MetricsProvider,
  type Counter,
  type Timer,
  type TimerStop,
  type Histogram,
  type MetricOptions,
  type MetricLabels,
  type MetricLabelValue,
  type BusinessMetric,
  type BusinessMetricHook,
  METRICS_PROVIDER,
  TRACK_TIME_METADATA,
  HTTP_REQUESTS_TOTAL,
  HTTP_REQUEST_DURATION_MS,
  METHOD_DURATION_MS,
} from "./metrics";

export {
  EventBusModule,
  EventBusService,
  EventHandler,
  type EventBusModuleOptions,
  type IEventBus,
  type IEventHandler,
  type AnyEvent,
  type DomainEvent,
  type ApplicationEvent,
  OutboxService,
  DeadLetterService,
  RetryService,
} from "./event-bus";

export * from "./jobs";
export * from "./logging";
