import { ExecutionContext,Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerGuard, type ThrottlerRequest } from "@nestjs/throttler";

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    // Use the parent ThrottlerGuard logic
    const { context, limit, ttl } = requestProps;
    const { req } = this.getRequestResponse(context);
    return super.handleRequest({ ...requestProps, req });
  }
}
