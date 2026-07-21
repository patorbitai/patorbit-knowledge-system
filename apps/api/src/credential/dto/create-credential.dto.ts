// apps/api/src/credential/dto/create-credential.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCredentialDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  issuer: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsDateString()
  issuedAt: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  credentialId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  url?: string;
}
