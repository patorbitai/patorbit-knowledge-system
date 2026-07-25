// apps/api/src/account/account.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { type JwtPayload, passwordService } from '@patorbit/auth';
import { type PrismaService } from '@patorbit/database';

import { type ChangePasswordDto } from './dto/change-password.dto';
import { type UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException();
    return user.profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.getProfile(userId);
    if (!profile) throw new UnauthorizedException();

    return this.prisma.profile.update({
      where: { id: profile.id },
      data: dto,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new UnauthorizedException();

    const isMatch = await passwordService.verify(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect current password');
    }

    const newPasswordHash = await passwordService.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }
}
