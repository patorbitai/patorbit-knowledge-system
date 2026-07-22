// apps/api/src/common/csrf.middleware.ts
import { ForbiddenException, Injectable, type NestMiddleware } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type NextFunction, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

    // Get token from cookie (signed at server)
    const cookieToken = req.cookies['__Host-csrf-token'];

    if (isStateChangingMethod) {
      // Get token from header (sent by client)
      const headerToken = req.headers['x-csrf-token'] as string;

      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }

    // Set new token on every GET request for fresh pages
    if (req.method === 'GET') {
      const token = uuidv4();
      res.cookie('__Host-csrf-token', token, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'strict',
        path: '/',
      });
      // Expose a way for the frontend to get the token, but not via cookie read
      req.csrfToken = () => token;
    }

    next();
  }
}

// Extend Express Request type
declare module 'express' {
  interface Request {
    csrfToken?: () => string;
  }
}
