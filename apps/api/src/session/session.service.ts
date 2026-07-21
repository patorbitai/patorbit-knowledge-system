// apps/api/src/session/session.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../../packages/database/prisma.service";
import { v4 as uuidv4 } from "uuid";

// Session duration constants
const SESSION_DURATION_REGULAR_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SESSION_DURATION_REMEMBER_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const REFRESH_TOKEN_DURATION_REGULAR_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const REFRESH_TOKEN_DURATION_REMEMBER_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    refreshToken: string,
    options?: {
      rememberMe?: boolean;
      deviceType?: string;
      deviceName?: string;
      deviceOs?: string;
      browser?: string;
      ipAddress?: string;
    }
  ) {
    const rememberMe = options?.rememberMe ?? false;
    const sessionDuration = rememberMe
      ? SESSION_DURATION_REMEMBER_MS
      : SESSION_DURATION_REGULAR_MS;
    const refreshDuration = rememberMe
      ? REFRESH_TOKEN_DURATION_REMEMBER_MS
      : REFRESH_TOKEN_DURATION_REGULAR_MS;

    return this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        rememberMe,
        deviceType: options?.deviceType,
        deviceName: options?.deviceName,
        deviceOs: options?.deviceOs,
        browser: options?.browser,
        ipAddress: options?.ipAddress,
        expiresAt: new Date(Date.now() + sessionDuration),
        refreshExpiresAt: new Date(Date.now() + refreshDuration),
      },
    });
  }

  async validateAndRotate(oldRefreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: oldRefreshToken },
      include: { user: { include: { role: true } } },
    });

    if (
      !session ||
      session.revokedAt ||
      new Date() > session.refreshExpiresAt
    ) {
      // If session was revoked, clean up any associated data
      if (session?.revokedAt) {
        throw new UnauthorizedException("Session has been revoked");
      }
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    return { session, user: session.user };
  }

  async updateRefreshToken(sessionId: string, newRefreshToken: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken: newRefreshToken,
        lastUsedAt: new Date(),
      },
    });
  }

  async revoke(refreshToken: string) {
    try {
      return await this.prisma.session.update({
        where: { refreshToken },
        data: { revokedAt: new Date() },
      });
    } catch {
      return null;
    }
  }

  async revokeSessionById(sessionId: string, userId: string) {
    return this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
  }

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        deviceType: true,
        deviceName: true,
        deviceOs: true,
        browser: true,
        ipAddress: true,
        isTrusted: true,
        rememberMe: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string) {
    const where: Record<string, unknown> = { userId, revokedAt: null };
    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }
    return this.prisma.session.updateMany({
      where: where as any,
      data: { revokedAt: new Date() },
    });
  }

  async findByRefreshToken(refreshToken: string) {
    return this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: { include: { role: true } } },
    });
  }
}
