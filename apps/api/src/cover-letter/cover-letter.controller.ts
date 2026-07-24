// apps/api/src/cover-letter/cover-letter.controller.ts
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
  Query,
  UseGuards,
} from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type CoverLetterService } from './cover-letter.service';
import { type CreateCoverLetterDto } from './dto/create-cover-letter.dto';
import { type QueryCoverLetterDto } from './dto/query-cover-letter.dto';
import { type UpdateCoverLetterDto } from './dto/update-cover-letter.dto';

@UseGuards(JwtAuthGuard)
@Controller('cover-letters')
export class CoverLetterController {
  constructor(private readonly coverLetterService: CoverLetterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCoverLetterDto, @CurrentUser() user: JwtPayload) {
    return this.coverLetterService.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryCoverLetterDto, @CurrentUser() user: JwtPayload) {
    return this.coverLetterService.findAll(query, user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.coverLetterService.findOne(id, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCoverLetterDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.coverLetterService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.coverLetterService.softDelete(id, user.sub);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  duplicate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.coverLetterService.duplicate(id, user.sub);
  }
}
