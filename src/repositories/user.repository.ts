import { prisma } from "@/lib/prisma";

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({ data });
  },

  async update(id: string, data: { name?: string }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },
};
