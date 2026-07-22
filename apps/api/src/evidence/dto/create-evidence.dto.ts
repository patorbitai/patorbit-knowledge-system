
import { EvidenceType } from '@patorbit/database';
import { IsEnum,IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEvidenceDto {
  @IsString()
  @IsNotEmpty()
  claimId: string;

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
