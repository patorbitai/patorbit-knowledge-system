// apps/api/src/resume/ai/dto/improve-text.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ImproveTextDto {
  @ApiProperty({
    description: 'The text to improve.',
    example: 'Led a team of engineers to build a new feature.',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;
}
