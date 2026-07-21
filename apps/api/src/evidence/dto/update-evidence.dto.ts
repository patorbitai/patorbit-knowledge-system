
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { EvidenceType } from '@prisma/client';

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
