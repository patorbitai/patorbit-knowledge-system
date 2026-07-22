// apps/api/src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import {
  type ForgotPasswordDto,
  type JwtPayload,
  type LoginDto,
  passwordService,
  type RegisterDto,
  type ResetPasswordDto,
} from "@patorbit/auth";
import { AUDIT_OUTCOME } from "@patorbit/auth";
import { type PrismaService } from '@patorbit/database';
import { v4 as uuidv4 } from "uuid";

import { type AuditService } from "../audit/audit.service";
import { type IdentityService } from "../identity/identity.service";
import { type SessionService } from "../session/session.service";
import { type TokenService } from "./token.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly identityService: IdentityService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.identityService.createUser(dto);
    this.auditService.log({
      userId: user.id,
      action: "user.register",
      outcome: AUDIT_OUTCOME.SUCCESS,
    });
    return { id: user.id, email: user.email };
  }

  async login(dto: LoginDto, metadata?: { ipAddress?: string; deviceType?: string; deviceName?: string; deviceOs?: string; browser?: string }) {
    const user = await this.identityService.validateUser(
      dto.email,
      dto.password
    );
    if (!user) {
      this.auditService.log({
        action: "user.login.failed",
        outcome: AUDIT_OUTCOME.FAILURE,
        metadata: { email: dto.email, reason: "Invalid credentials" },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.userRoles[0]?.role?.name,
      type: "access",
    };
    const { accessToken, refreshToken } = await this.tokenService.generateTokens(
      payload
    );
    await this.sessionService.create(user.id, refreshToken, {
      rememberMe: dto.rememberMe,
      ...metadata,
    });

    this.auditService.log({
      userId: user.id,
      action: "user.login",
      outcome: AUDIT_OUTCOME.SUCCESS,
      metadata: { rememberMe: dto.rememberMe },
    });
    return { accessToken, refreshToken };
  }

  async refresh(oldRefreshToken: string) {
    if (!oldRefreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const { session, user } = await this.sessionService.validateAndRotate(
      oldRefreshToken
    );

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.userRoles[0]?.role?.name,
      type: "access",
    };
    const { accessToken, refreshToken: newRefreshToken } =
      await this.tokenService.generateTokens(payload);
    await this.sessionService.updateRefreshToken(
      session.id,
      newRefreshToken
    );

    this.auditService.log({
      userId: user.id,
      action: "user.refresh",
      outcome: AUDIT_OUTCOME.SUCCESS,
    });
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      const session = await this.sessionService.revoke(refreshToken);
      if (session) {
        this.auditService.log({
          userId: (session as any).userId,
          action: "user.logout",
          outcome: AUDIT_OUTCOME.SUCCESS,
        });
      }
    }
  }

  async getProfile(userId: string) {
    return this.identityService.findUserById(userId);
  }

  async sendVerificationEmail(userId: string, email: string) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await this.prisma.verificationToken.create({
      data: {
        userId,
        token,
        type: "email_verification",
        expiresAt,
      },
    });

    // In production, this would send an actual email
    const appUrl = this.configService.get<string>("AUTH_URL", "http://localhost:3000");
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    this.auditService.log({
      userId,
      action: "user.verify_email",
      outcome: AUDIT_OUTCOME.SUCCESS,
      metadata: { type: "sent" },
    });

    return { verifyUrl };
  }

  async verifyEmail(token: string) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !verificationToken ||
      verificationToken.type !== "email_verification" ||
      new Date() > verificationToken.expiresAt
    ) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    await this.prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    this.auditService.log({
      userId: verificationToken.userId,
      action: "user.verify_email",
      outcome: AUDIT_OUTCOME.SUCCESS,
      metadata: { type: "verified" },
    });

    return { message: "Email verified successfully" };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: "If that email is registered, you will receive a reset link" };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: "password_reset",
        expiresAt,
      },
    });

    // In production, send email with reset link
    const appUrl = this.configService.get<string>("AUTH_URL", "http://localhost:3000");
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    this.auditService.log({
      userId: user.id,
      action: "user.password_reset",
      outcome: AUDIT_OUTCOME.SUCCESS,
      metadata: { type: "sent" },
    });

    return { message: "If that email is registered, you will receive a reset link", resetUrl };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token: dto.token },
    });

    if (
      !verificationToken ||
      verificationToken.type !== "password_reset" ||
      new Date() > verificationToken.expiresAt
    ) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordHash = await passwordService.hash(dto.password);

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { passwordHash },
    });

    // Revoke all sessions for this user after password reset
    await this.sessionService.revokeAllUserSessions(verificationToken.userId);

    // Clean up used token
    await this.prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    this.auditService.log({
      userId: verificationToken.userId,
      action: "user.password_reset",
      outcome: AUDIT_OUTCOME.SUCCESS,
      metadata: { type: "reset" },
    });

    return { message: "Password reset successfully" };
  }

  async getSessions(userId: string) {
    return this.sessionService.listSessions(userId);
  }

  async revokeSession(sessionId: string, userId: string) {
    await this.sessionService.revokeSessionById(sessionId, userId);
    this.auditService.log({
      userId,
      action: "session.revoke",
      outcome: AUDIT_OUTCOME.SUCCESS,
      metadata: { sessionId },
    });
    return { message: "Session revoked" };
  }

  async revokeAllSessions(userId: string, currentSessionId?: string) {
    await this.sessionService.revokeAllUserSessions(userId, currentSessionId);
    this.auditService.log({
      userId,
      action: "session.revoke",
      outcome: AUDIT_OUTCOME.SUCCESS,
      metadata: { all: true },
    });
    return { message: "All other sessions revoked" };
  }
}
