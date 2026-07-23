import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';

import { type PermissionService } from '../../permission/permission.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    for (const permission of requiredPermissions) {
      const [resource, action] = permission.split(':');
      if (!resource || !action) {
        throw new ForbiddenException(`Invalid permission format: ${permission}`);
      }
      const hasPermission = await this.permissionService.userHasPermission(
        user.userId,
        resource,
        action,
      );
      if (!hasPermission) {
        throw new ForbiddenException(`Missing required permission: ${permission}`);
      }
    }

    return true;
  }
}
