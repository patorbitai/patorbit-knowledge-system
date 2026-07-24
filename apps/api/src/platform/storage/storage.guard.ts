import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';
import { type Request } from 'express';

/**
 * A guard that ensures a user can only access storage resources belonging to them.
 * It assumes the user ID is available in the JWT payload and the target user/profile ID
 * is present in the request params.
 */
@Injectable()
export class StorageGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Attempt to get the target user/profile ID from common param names
    const targetId = request.params.userId || request.params.profileId;

    if (!targetId) {
      // If no ID is in the path, we cannot verify ownership.
      // For safety, deny access. A more specific guard might be needed.
      throw new ForbiddenException('Cannot determine resource ownership');
    }

    // The user's own ID from the token must match the ID in the path.
    if (user.sub !== targetId) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
