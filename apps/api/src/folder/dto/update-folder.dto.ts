// apps/api/src/folder/dto/update-folder.dto.ts
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
