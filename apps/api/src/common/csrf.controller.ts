// apps/api/src/common/csrf.controller.ts
import { Controller, Get, Req } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type Request } from 'express';

import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class CsrfController {
  private readonly isProduction: boolean;

  constructor(configService: ConfigService) {
    this.isProduction = configService.get('NODE_ENV') === 'production';
  }

  @Public()
  @Get('api/auth/csrf')
  getCsrfToken(@Req() req: Request) {
    const cookieName = this.isProduction ? '__Host-csrf-token' : 'csrf-token';
    const token = req.cookies?.[cookieName];
    return { csrfToken: token };
  }
}
