import { ResumeStatus } from '@patorbit/database';
import { IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateResumeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  templateId?: string;

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
