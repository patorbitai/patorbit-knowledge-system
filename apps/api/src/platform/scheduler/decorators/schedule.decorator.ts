import { SetMetadata } from "@nestjs/common";

export const CRON_DECORATOR = "scheduler:cron";
export const INTERVAL_DECORATOR = "scheduler:interval";
export const TIMEOUT_DECORATOR = "scheduler:timeout";
export const SCHEDULE_CRON = CRON_DECORATOR;
export const SCHEDULE_INTERVAL = INTERVAL_DECORATOR;
export const SCHEDULE_TIMEOUT = TIMEOUT_DECORATOR;

export function Cron(cronExpression: string): MethodDecorator {
  return SetMetadata(CRON_DECORATOR, cronExpression);
}

export function Interval(milliseconds: number): MethodDecorator {
  return SetMetadata(INTERVAL_DECORATOR, milliseconds);
}

export function Timeout(milliseconds: number): MethodDecorator {
  return SetMetadata(TIMEOUT_DECORATOR, milliseconds);
}
