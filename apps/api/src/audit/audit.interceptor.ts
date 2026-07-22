// apps/api/src/audit/audit.interceptor.ts
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { type Reflector } from "@nestjs/core";
import { type Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { v4 as uuid } from "uuid";

import { AUDIT_METADATA,type AuditOptions } from "./audit.decorator";
import { type AuditService } from "./audit.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const options = this.getAuditOptions(context);
    if (options === null) {
      return next.handle();
    }

    // Attach correlation ID to the request for downstream use.
    const req = context.switchToHttp().getRequest();
    req.correlationId = req.headers["x-correlation-id"] || uuid();

    return next.handle().pipe(
      tap({
        next: (value) =>
          this.log(context, options, { outcome: "success", value }),
        error: (error) =>
          this.log(context, options, { outcome: "failure", error }),
      }),
    );
  }

  private async log(
    context: ExecutionContext,
    options: AuditOptions,
    result: { outcome: "success"; value?: any } | { outcome: "failure"; error: any },
  ) {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const user = req.user as { userId?: string } | undefined;

    const { action, resource, resourceId } = this.deriveEventDetails(
      context,
      options,
      result,
    );

    await this.auditService.createEvent({
      userId: user?.userId,
      action,
      resource,
      resourceId,
      outcome: result.outcome,
      ipAddress: req.ip as string,
      userAgent: req.get("User-Agent"),
      correlationId: req.correlationId,
      metadata: {
        ...options,
        handler: context.getHandler().name,
        controller: context.getClass().name,
        httpMethod: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        ...(result.outcome === "failure" && {
          error: result.error.message,
          stack: result.error.stack,
        }),
      },
    });
  }

  private deriveEventDetails(
    context: ExecutionContext,
    options: AuditOptions,
    result: { outcome: "success"; value?: any } | { outcome: "failure"; error: any },
  ) {
    const req = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    const defaultAction = `${controller.name
      .replace(/Controller$/, "")
      .toLowerCase()}.${handler.name}`;

    const defaultResource = controller.name
      .replace(/Controller$/, "")
      .toLowerCase();

    const defaultResourceId =
      req.params?.id ??
      (result.outcome === "success" ? result.value?.id : undefined);

    return {
      action: options.action ?? defaultAction,
      resource: options.resource ?? defaultResource,
      resourceId: options.resourceId ?? defaultResourceId,
    };
  }

  private getAuditOptions(context: ExecutionContext): AuditOptions | null {
    const classOptions = this.reflector.get<AuditOptions | undefined>(
      AUDIT_METADATA,
      context.getClass(),
    );
    const handlerOptions = this.reflector.get<AuditOptions | undefined>(
      AUDIT_METADATA,
      context.getHandler(),
    );

    if (classOptions === undefined && handlerOptions === undefined) {
      return null;
    }

    return { ...(classOptions ?? {}), ...(handlerOptions ?? {}) };
  }
}
