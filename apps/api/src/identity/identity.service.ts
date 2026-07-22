// apps/api/src/identity/identity.service.ts
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { LOCKOUT_DURATION_MINUTES,LOCKOUT_THRESHOLD, passwordService, type RegisterDto } from "@patorbit/auth";
import { type PrismaService } from '@patorbit/database';

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException("Email already in use");
    }
    const passwordHash = await passwordService.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: {
          create: { name: dto.name },
        },
      },
      include: { profile: true },
    });
  }

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { userRoles: { include: { role: true } }, profile: true },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    // Check account lockout
    if (user.isLocked) {
      if (user.lockExpiresAt && new Date() < user.lockExpiresAt) {
        throw new UnauthorizedException("Account is temporarily locked. Try again later.");
      }
      // Lock expired — reset
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isLocked: false, lockExpiresAt: null, loginAttempts: 0 },
      });
    }

    const isMatch = await passwordService.verify(pass, user.passwordHash);

    if (!isMatch) {
      // Increment failed attempts
      const attempts = user.loginAttempts + 1;
      const updates: Record<string, unknown> = { loginAttempts: attempts };

      if (attempts >= LOCKOUT_THRESHOLD) {
        updates.isLocked = true;
        updates.lockExpiresAt = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updates as any,
      });

      return null;
    }

    // Reset login attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, userRoles: { include: { role: true } } },
    });
  }
}
