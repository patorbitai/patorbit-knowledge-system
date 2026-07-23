// apps/api/src/permission/permissions.guard.ts
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { type JwtPayload } from '@patorbit/auth';

import { type PermissionService } from './permission.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!user?.sub) {
      throw new InternalServerErrorException(
        'PermissionsGuard requires a user object with a subject (sub) property. Ensure JwtAuthGuard runs first.',
      );
    }

    const hasPermission = await this.permissionService.userHasPermissions(
      user.sub,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have the required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
