
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { EvidenceType } from '@prisma/client';

export class CreateEvidenceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EvidenceType)
  @IsNotEmpty()
  type: EvidenceType;
}
