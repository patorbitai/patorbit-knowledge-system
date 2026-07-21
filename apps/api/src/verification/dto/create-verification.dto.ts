// apps/api/src/verification/dto/create-verification.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class CreateVerificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verifierId: string;

  @ApiProperty({ enum: VerificationStatus, default: VerificationStatus.PENDING })
  @IsString()
  @IsNotEmpty()
  status: VerificationStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
