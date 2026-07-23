// apps/api/src/common/csrf.middleware.ts
import { ForbiddenException, Injectable, type NestMiddleware } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type NextFunction, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  use(req: Request, res: Response, next: NextFunction) {
    const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

    const cookieName = this.isProduction ? '__Host-csrf-token' : 'csrf-token';

    // Get token from cookie (signed at server)
    const cookieToken = req.cookies[cookieName];

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
      res.cookie(cookieName, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      });
      // Expose a way for the frontend to get the token
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
