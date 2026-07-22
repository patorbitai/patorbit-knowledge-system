// apps/api/src/verification/dto/create-verification.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@patorbit/database';
import { IsNotEmpty, IsOptional,IsString } from 'class-validator';

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
