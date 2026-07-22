
import { IsNumber, IsOptional, IsString, Max,Min } from 'class-validator';

export class UpdateConfidenceScoreDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly score: number;

  @IsOptional()
  @IsString()
  readonly reason?: string;
}
