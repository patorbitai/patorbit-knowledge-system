import { EmploymentType, JobApplicationStatus, WorkMode } from '@patorbit/database';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class CreateJobApplicationDto {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsOptional()
  jobDescription?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  salary?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(WorkMode)
  @IsOptional()
  workMode?: WorkMode;

  @IsUUID()
  @IsOptional()
  resumeId?: string;

  @IsUUID()
  @IsOptional()
  coverLetterId?: string;

  @IsDateString()
  @IsOptional()
  appliedDate?: string;

  @IsUrl()
  @IsOptional()
  applicationUrl?: string;

  @IsString()
  @IsOptional()
  recruiterContact?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(JobApplicationStatus)
  @IsOptional()
  status?: JobApplicationStatus;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
