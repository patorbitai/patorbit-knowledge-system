import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class ImportSectionDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}

export class ImportResultDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Raw extracted text (optional)
  @IsOptional()
  @IsString()
  rawText?: string;

  // Metadata about the import (optional)
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSectionDto)
  sections?: ImportSectionDto[];
}
