// apps/api/src/cover-letter/dto/query-cover-letter.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class QueryCoverLetterDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  folderId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  sort?: string;

  @IsString()
  @IsOptional()
  page?: number;

  @IsString()
  @IsOptional()
  limit?: number;
}
