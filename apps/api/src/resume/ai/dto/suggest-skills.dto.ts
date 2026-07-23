// apps/api/src/resume/ai/dto/suggest-skills.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SuggestSkillsDto {
  @ApiProperty({
    description: 'The job title or text to suggest skills from.',
    example: 'Senior Software Engineer',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}
