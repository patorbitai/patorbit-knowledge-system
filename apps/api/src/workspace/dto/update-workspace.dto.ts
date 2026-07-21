import { PartialType } from "@nestjs/common";
import { CreateWorkspaceDto } from "./create-workspace.dto";

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {}
