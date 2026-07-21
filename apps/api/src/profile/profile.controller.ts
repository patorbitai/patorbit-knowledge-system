import { Controller, Get, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/decorators/public.decorator";
import { JwtPayload } from "@patorbit/auth";

@Controller("profiles")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.findByUserId(user.sub);
  }

  @Public()
  @Get(":id")
  async getProfile(@Param("id") id: string) {
    return this.profileService.findById(id);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: { name?: string; headline?: string; summary?: string; avatarUrl?: string; locale?: string; timezone?: string }
  ) {
    return this.profileService.update(user.sub, data);
  }

  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.softDelete(user.sub);
  }
}
