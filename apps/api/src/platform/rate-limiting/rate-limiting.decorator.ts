import { SetMetadata } from "@nestjs/common";

export const THROTTLE_LIMIT = "THROTTLE_LIMIT";
export const THROTTLE_TTL = "THROTTLE_TTL";

export const Throttle = (limit: number, ttl: number) =>
  SetMetadata(THROTTLE_LIMIT, limit) && SetMetadata(THROTTLE_TTL, ttl);

export const SkipThrottle = () => SetMetadata("throttler:skip", true);