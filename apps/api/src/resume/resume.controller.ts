import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { QueryResumeDto } from './dto/query-resume.dto';
import { DuplicateResumeDto } from './dto/duplicate-resume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@patorbit/auth';

@UseGuards(JwtAuthGuard)
@Controller('resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createResumeDto: CreateResumeDto, @CurrentUser() user: JwtPayload) {
    return this.resumeService.create(createResumeDto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryResumeDto, @CurrentUser() user: JwtPayload) {
    return this.resumeService.findAll(query, user.sub);
  }

  @Get('recent')
  findRecent(@CurrentUser() user: JwtPayload) {
    return this.resumeService.findRecent(user.sub);
  }

  @Get('drafts')
  findDrafts(@CurrentUser() user: JwtPayload) {
    return this.resumeService.findDrafts(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.resumeService.findOne(id, user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.resumeService.update(id, updateResumeDto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.resumeService.softDelete(id, user.sub);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  duplicate(
    @Param('id') id: string,
    @Body() dto: DuplicateResumeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.resumeService.duplicate(id, dto, user.sub);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.resumeService.archive(id, user.sub);
  }

  // Versioning
  @Get(':id/versions')
  listVersions(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.resumeService.listVersions(id, user.sub);
  }

  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  createVersion(
    @Param('id') id: string,
    @Body('note') note: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.resumeService.createVersion(id, note, user.sub);
  }

  @Post(':id/versions/:versionId/restore')
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.resumeService.restoreVersion(id, versionId, user.sub);
  }

  @Get(':id/versions/:versionAId/compare/:versionBId')
  compareVersions(
    @Param('id') id: string,
    @Param('versionAId') versionAId: string,
    @Param('versionBId') versionBId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.resumeService.compareVersions(id, versionAId, versionBId, user.sub);
  }
}
