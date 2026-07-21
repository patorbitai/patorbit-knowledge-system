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
import { ParseUUIDPipe } from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { AddMemberDto } from "./dto/add-member.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "@patorbit/auth";

@Controller("organizations")
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizationService.create(dto, user.sub);
  }

  @Get()
  async findAll() {
    return this.organizationService.findAll();
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.organizationService.findById(id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param("id") id: string) {
    await this.organizationService.softDelete(id);
  }

  @Post(":id/members")
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param("id") id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizationService.addMember(id, dto.profileId, dto.role);
  }

  @Delete(":id/members/:profileId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param("id") id: string,
    @Param("profileId") profileId: string,
  ) {
    await this.organizationService.removeMember(id, profileId);
  }

  @Patch(":id/members/:profileId")
  async updateMemberRole(
    @Param("id") id: string,
    @Param("profileId") profileId: string,
    @Body("role") role: any,
  ) {
    return this.organizationService.updateMemberRole(id, profileId, role);
  }

  @Get(":id/members")
  async getMembers(@Param("id") id: string) {
    return this.organizationService.getMembers(id);
  }
}
