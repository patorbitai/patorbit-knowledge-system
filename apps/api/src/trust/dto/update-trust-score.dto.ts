
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateTrustScoreDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly score: number;

  @IsOptional()
  @IsString()
  readonly reason?: string;
}
