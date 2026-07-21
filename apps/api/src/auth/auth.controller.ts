// apps/api/src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from "@patorbit/auth";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtPayload } from "@patorbit/auth";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { ConfigService } from "@nestjs/config";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  private setRefreshTokenCookie(res: Response, token: string, rememberMe: boolean) {
    const isProd = this.configService.get<string>("NODE_ENV") === "production";
    const maxAge = rememberMe
      ? 1000 * 60 * 60 * 24 * 90 // 90 days
      : 1000 * 60 * 60 * 24 * 7; // 7 days

    res.cookie("refresh_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      maxAge,
    });
  }

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { accessToken, refreshToken } = await this.authService.login(loginDto);
    this.setRefreshTokenCookie(res, refreshToken, loginDto.rememberMe || false);
    return { accessToken };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const oldRefreshToken = req.cookies["refresh_token"];
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(oldRefreshToken);

    const rememberMe = newRefreshToken ? true : false;
    this.setRefreshTokenCookie(res, newRefreshToken, rememberMe);

    return { accessToken };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies["refresh_token"];
    await this.authService.logout(refreshToken);
    res.clearCookie("refresh_token");
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Post("send-verification")
  @UseGuards(JwtAuthGuard)
  async sendVerification(@CurrentUser() user: JwtPayload) {
    return this.authService.sendVerificationEmail(user.sub, user.email);
  }

  @Public()
  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  // Session Management
  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: JwtPayload) {
    return this.authService.getSessions(user.sub);
  }

  @Delete("sessions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param("id") sessionId: string
  ) {
    return this.authService.revokeSession(sessionId, user.sub);
  }

  @Delete("sessions")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async revokeAllSessions(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    const currentSession = await this.authService.getSessions(user.sub);
    const currentSessionId = currentSession.find(s => s.ipAddress === req.ip)?.id;
    return this.authService.revokeAllSessions(user.sub, currentSessionId);
  }
}
