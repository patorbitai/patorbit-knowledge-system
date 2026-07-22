import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { type CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { type UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { type WorkspaceService } from "./workspace.service";

@Controller("workspaces")
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateWorkspaceDto) {
    return this.workspaceService.create(dto);
  }

  @Get("organization/:orgId")
  async findByOrganization(@Param("orgId") orgId: string) {
    return this.workspaceService.findByOrganization(orgId);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.workspaceService.findById(id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param("id") id: string) {
    await this.workspaceService.softDelete(id);
  }
}
