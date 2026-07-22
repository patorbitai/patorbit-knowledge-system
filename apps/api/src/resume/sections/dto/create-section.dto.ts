
import { SectionType } from '@patorbit/database';
import { IsBoolean, IsEnum, IsInt, IsObject,IsOptional, IsString } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(SectionType)
  type: SectionType;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCollapsible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCollapsed?: boolean;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
