import { IsLocale, IsOptional, IsString, IsTimeZone, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsLocale()
  @IsOptional()
  locale?: string;

  @IsTimeZone()
  @IsOptional()
  timezone?: string;
}
