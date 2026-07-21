// apps/api/src/user/user.controller.ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "@patorbit/auth";
import { IdentityService } from "../identity/identity.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly identityService: IdentityService) {}
  @Get("me")
  async getProfile(@CurrentUser() user: JwtPayload) {
    const profile = await this.identityService.findUserById(user.sub);
    return profile;
  }
}
