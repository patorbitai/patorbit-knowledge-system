import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Inject, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type JwtPayload } from '@patorbit/auth';
import { type StorageProvider, STORAGE_PROVIDER } from '@patorbit/storage';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../common/upload.service';
import { type UpdateProfileDto } from './dto/update-profile.dto';
import { type ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly uploadService: UploadService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.findByUserId(user.sub);
  }

  @Public()
  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.profileService.findById(id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() data: UpdateProfileDto) {
    return this.profileService.update(user.sub, data);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.uploadService.validateFile(file, ['image']);

    if (!await this.uploadService.detectVirus(file.buffer)) {
      throw new Error('Virus detected in file');
    }

    const optimizedBuffer = await this.uploadService.optimizeImage(file.buffer, {
      maxWidth: 800,
      maxHeight: 800,
      format: 'webp',
    });

    const sanitizedFilename = await this.uploadService.sanitizeFilename(file.originalname);
    const key = `avatars/${user.sub}/${sanitizedFilename}`;

    const { url } = await this.storage.upload(optimizedBuffer, key, {
      contentType: 'image/webp',
    });

    return this.profileService.update(user.sub, { avatarUrl: url });
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.softDelete(user.sub);
  }
}
