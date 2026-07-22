
import { IsOptional, IsString, IsEnum, IsObject, IsInt, Min } from 'class-validator';
import { ResumeStatus } from '@prisma/client';

export class UpdateResumeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(ResumeStatus)
  @IsOptional()
  status?: ResumeStatus;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsObject()
  @IsOptional()
  theme?: Record<string, any>;

  @IsInt()
  @Min(1)
  @IsOptional()
  expectedVersion?: number;
}
