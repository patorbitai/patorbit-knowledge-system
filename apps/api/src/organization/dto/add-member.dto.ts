import { IsString, IsEnum } from "class-validator";
import { OrganizationRole } from "@prisma/client";

export class AddMemberDto {
  @IsString()
  profileId: string;

  @IsEnum(OrganizationRole)
  role: OrganizationRole;
}
