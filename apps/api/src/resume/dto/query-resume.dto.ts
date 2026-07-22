
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max,Min } from 'class-validator';

export class QueryResumeDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  filter?: string; // e.g., status:DRAFT,status:ARCHIVED

  @IsOptional()
  @IsString()
  sort?: string; // e.g., createdAt:desc,updatedAt:asc

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
