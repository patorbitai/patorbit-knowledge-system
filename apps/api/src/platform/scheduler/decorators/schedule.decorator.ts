import { SetMetadata } from "@nestjs/common";

export const CRON_DECORATOR = "scheduler:cron";
export const INTERVAL_DECORATOR = "scheduler:interval";

export function Cron(cronExpression: string): MethodDecorator {
  return SetMetadata(CRON_DECORATOR, cronExpression);
}

export function Interval(milliseconds: number): MethodDecorator {
  return SetMetadata(INTERVAL_DECORATOR, milliseconds);
}
