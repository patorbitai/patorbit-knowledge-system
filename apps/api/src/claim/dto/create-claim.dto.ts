
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsDateString()
  date: string;
}
