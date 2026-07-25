// apps/api/src/account/dto/update-profile.dto.ts
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
