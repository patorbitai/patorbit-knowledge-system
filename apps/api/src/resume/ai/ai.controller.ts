// apps/api/src/resume/ai/ai.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { TenantScoped } from '../../common/tenant/tenant-scoped.decorator';
import { Permissions } from '../../permission/permissions.decorator';
import { PermissionsGuard } from '../../permission/permissions.guard';
import { type AiHooksService } from './ai-hooks.service';
import { GrammarReviewDto, ImproveTextDto, OptimizeAtsDto, SuggestSkillsDto } from './dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@TenantScoped()
@Controller('resumes/:resumeId/ai')
export class AiController {
  constructor(private readonly aiHooks: AiHooksService) {}

  @Post('improve-summary')
  @HttpCode(HttpStatus.OK)
  @Permissions('resume.ai:use')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Improve a resume summary',
    description: 'Uses AI to rewrite a professional summary for impact and clarity.',
  })
  @ApiBody({ type: ImproveTextDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The improved summary text.',
    type: String,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  improveSummary(@Body() improveTextDto: ImproveTextDto): Promise<string> {
    return this.aiHooks.improveSummary(improveTextDto.text);
  }

  @Post('improve-bullet')
  @HttpCode(HttpStatus.OK)
  @Permissions('resume.ai:use')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Improve a resume bullet point',
    description:
      'Uses AI to rewrite a bullet point using strong action verbs and quantifiable results.',
  })
  @ApiBody({ type: ImproveTextDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The improved bullet point text.',
    type: String,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  improveBullet(@Body() improveTextDto: ImproveTextDto): Promise<string> {
    return this.aiHooks.improveBullet(improveTextDto.text);
  }

  @Post('suggest-skills')
  @HttpCode(HttpStatus.OK)
  @Permissions('resume.ai:use')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Suggest relevant skills',
    description: 'Uses AI to suggest skills based on a job title or description.',
  })
  @ApiBody({ type: SuggestSkillsDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A list of suggested skills.',
    type: [String],
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  suggestSkills(@Body() suggestSkillsDto: SuggestSkillsDto): Promise<string[]> {
    return this.aiHooks.suggestSkills(suggestSkillsDto.title);
  }

  @Post('grammar-review')
  @HttpCode(HttpStatus.OK)
  @Permissions('resume.ai:use')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Perform a grammar review',
    description: 'Uses AI to check text for grammar, spelling, and style issues.',
  })
  @ApiBody({ type: GrammarReviewDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A list of grammatical suggestions.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start: { type: 'number' },
          end: { type: 'number' },
          suggestion: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  grammarReview(
    @Body() grammarReviewDto: GrammarReviewDto,
  ): Promise<Array<{ start: number; end: number; suggestion: string }>> {
    return this.aiHooks.grammarReview(grammarReviewDto.text);
  }

  @Post('optimize-ats')
  @HttpCode(HttpStatus.OK)
  @Permissions('resume.ai:use')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Optimize resume for ATS',
    description: 'Uses AI to optimize resume content for Applicant Tracking Systems.',
  })
  @ApiBody({ type: OptimizeAtsDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The optimized resume content as a JSON object.',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
  optimizeAts(@Body() optimizeAtsDto: OptimizeAtsDto): Promise<Record<string, unknown>> {
    return this.aiHooks.optimizeATS(optimizeAtsDto.content);
  }
}
