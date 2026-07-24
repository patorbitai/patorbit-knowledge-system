// apps/api/src/cover-letter/dto/update-cover-letter.dto.ts
import { AssetStatus } from '@patorbit/database';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateCoverLetterDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}
