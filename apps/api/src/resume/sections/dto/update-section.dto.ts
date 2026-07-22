
import { IsOptional, IsString, IsEnum, IsInt, IsBoolean, IsObject } from 'class-validator';
import { SectionType } from '@prisma/client';

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(SectionType)
  @IsOptional()
  type?: SectionType;

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
