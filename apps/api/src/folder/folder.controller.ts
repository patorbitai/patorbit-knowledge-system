// apps/api/src/folder/folder.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type CreateFolderDto } from './dto/create-folder.dto';
import { type UpdateFolderDto } from './dto/update-folder.dto';
import { type FolderService } from './folder.service';

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateFolderDto, @CurrentUser() user: JwtPayload) {
    return this.folderService.create(dto, user.sub);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.folderService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.folderService.findOne(id, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFolderDto, @CurrentUser() user: JwtPayload) {
    return this.folderService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.folderService.remove(id, user.sub);
  }
}
