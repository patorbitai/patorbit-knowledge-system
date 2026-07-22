// apps/api/src/permission/permission.service.ts
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { type PrismaService } from '@patorbit/database';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Role Management ──────────────────────────────────

  async createRole(data: { name: string; description?: string; isSystem?: boolean }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException("Role already exists");

    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        isSystem: data.isSystem ?? false,
      },
    });
  }

  async listRoles() {
    return this.prisma.role.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { userRoles: true } } },
    });
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true, userRoles: { include: { user: true } } },
    });
    if (!role) throw new NotFoundException("Role not found");
    return role;
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException("Role not found");
    if (role.isSystem) throw new ConflictException("Cannot delete system role");
    return this.prisma.role.delete({ where: { id } });
  }

  // ── Permission Management ────────────────────────────

  async createPermission(data: { name: string; resource: string; action: string; description?: string }) {
    const existing = await this.prisma.permission.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException("Permission already exists");

    return this.prisma.permission.create({ data });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] });
  }

  // ── Role-Permission Assignment ───────────────────────

  async assignPermissionToRole(roleId: string, permissionId: string) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: { permissions: { connect: { id: permissionId } } },
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: { permissions: { disconnect: { id: permissionId } } },
    });
  }

  // ── User-Role Assignment ─────────────────────────────

  async assignUserRole(userId: string, roleId: string) {
    return this.prisma.userRole.create({
      data: { userId, roleId },
    });
  }

  async removeUserRole(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }

  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: true } } },
    });
  }

  // ── Permission Checking ──────────────────────────────

  async userHasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: true } } },
    });

    return userRoles.some((ur) =>
      ur.role.permissions.some((p) => p.resource === resource && p.action === action)
    );
  }

  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.some((ur) => ur.role.name === roleName);
  }

  // ── Seed Default Roles & Permissions ────────────────

  async seedDefaults() {
    // Create default roles if they don't exist
    const adminRole = await this.prisma.role.upsert({
      where: { name: "admin" },
      update: {},
      create: { name: "admin", description: "System administrator", isSystem: true },
    });

    const userRole = await this.prisma.role.upsert({
      where: { name: "user" },
      update: {},
      create: { name: "user", description: "Registered user", isSystem: true },
    });

    // Create base permissions
    const permissions = [
      { name: "user:read", resource: "user", action: "read", description: "Read own user data" },
      { name: "user:update", resource: "user", action: "update", description: "Update own user data" },
      { name: "session:read", resource: "session", action: "read", description: "List own sessions" },
      { name: "session:delete", resource: "session", action: "delete", description: "Revoke own sessions" },
      { name: "audit:read", resource: "audit", action: "read", description: "Read audit logs" },
      { name: "admin:manage", resource: "admin", action: "manage", description: "Full admin access" },
      { name: "role:manage", resource: "role", action: "manage", description: "Manage roles" },
      { name: "permission:manage", resource: "permission", action: "manage", description: "Manage permissions" },
    ];

    for (const perm of permissions) {
      await this.prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: {
          ...perm,
          roles: {
            connect: {
              id: (perm.resource === 'admin' || perm.resource === 'role' || perm.resource === 'permission')
                ? adminRole.id
                : userRole.id
            }
          }
        },
      });
    }

    return { adminRole, userRole };
  }
}
