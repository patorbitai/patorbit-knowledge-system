import { OrganizationRole } from '@patorbit/database';
import { IsEnum,IsString } from "class-validator";

export class AddMemberDto {
  @IsString()
  profileId: string;

  @IsEnum(OrganizationRole)
  role: OrganizationRole;
}
