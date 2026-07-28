import { prisma } from "@/lib/prisma";

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({ data });
  },
};
