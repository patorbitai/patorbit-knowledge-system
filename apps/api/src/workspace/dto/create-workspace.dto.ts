import { IsString, IsUUID, MaxLength } from "class-validator";

export class CreateWorkspaceDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsUUID()
  organizationId: string;
}
