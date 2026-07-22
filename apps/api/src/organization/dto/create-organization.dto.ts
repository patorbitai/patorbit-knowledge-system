import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateOrganizationDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;
}
