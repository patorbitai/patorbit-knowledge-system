
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateImportJobDto {
  @IsString()
  @IsNotEmpty()
  sourceType: string; // "pdf", "docx", "json", "linkedin"

  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @IsString()
  @IsOptional()
  profileId?: string;
}
