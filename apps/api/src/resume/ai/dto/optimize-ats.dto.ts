// apps/api/src/resume/ai/dto/optimize-ats.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class OptimizeAtsDto {
  @ApiProperty({
    description: 'The resume content to optimize for ATS, as a JSON object.',
    example: {
      summary: 'Experienced developer.',
      experience: [{ title: 'Dev', company: 'Acme' }],
    },
  })
  @IsObject()
  @IsNotEmpty()
  content: Record<string, unknown>;
}
