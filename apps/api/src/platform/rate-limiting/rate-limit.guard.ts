import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async handleRequest(context: ExecutionContext, limit: number, ttl: number): Promise<boolean> {
    // Use the parent ThrottlerGuard logic
    return super.handleRequest(context, limit, ttl);
  }
}
