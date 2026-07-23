// apps/api/src/resume/ai/dto/grammar-review.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GrammarReviewDto {
  @ApiProperty({
    description: 'The text to review for grammar.',
    example: 'I has been workin on this project for 2 years.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
