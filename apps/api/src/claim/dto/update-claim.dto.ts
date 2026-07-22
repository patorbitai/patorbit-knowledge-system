
import { IsDateString,IsOptional, IsString } from 'class-validator';

export class UpdateClaimDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
