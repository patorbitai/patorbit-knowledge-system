// apps/api/src/common/csrf.controller.ts
import { Controller, Get, Req } from "@nestjs/common";
import { Request } from "express";
import { Public } from "../auth/decorators/public.decorator";

@Controller()
export class CsrfController {
  @Public()
  @Get("api/auth/csrf")
  getCsrfToken(@Req() req: Request) {
    const token = req.cookies?.["__Host-csrf-token"];
    return { csrfToken: token };
  }
}