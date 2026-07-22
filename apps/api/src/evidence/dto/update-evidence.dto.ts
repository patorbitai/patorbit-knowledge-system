
import { EvidenceType } from '@patorbit/database';
import { IsEnum,IsOptional, IsString } from 'class-validator';

export class UpdateEvidenceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EvidenceType)
  @IsOptional()
  type?: EvidenceType;
}
