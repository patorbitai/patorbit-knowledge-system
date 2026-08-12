import { describe, it, expect, beforeEach } from "vitest";
import { userRepository } from "@/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("Settings & Account Management", () => {
  const email1 = `user1-${Date.now()}@example.com`;
  const email2 = `user2-${Date.now()}@example.com`;
  let userId1: string;
  let userId2: string;

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [email1, email2] } } }).catch(() => {});

    const u1 = await userRepository.create({
      name: "User One",
      email: email1,
      passwordHash: await bcrypt.hash("Password123!", 10),
    });
    userId1 = u1.id;

    const u2 = await userRepository.create({
      name: "User Two",
      email: email2,
      passwordHash: await bcrypt.hash("Password123!", 10),
    });
    userId2 = u2.id;
  });

  it("profile update modifies supported user fields", async () => {
    const updated = await userRepository.update(userId1, { name: "Updated Name One" });
    expect(updated.name).toBe("Updated Name One");

    const fetched = await userRepository.findById(userId1);
    expect(fetched?.name).toBe("Updated Name One");
  });

  it("account deletion removes the correct user's data", async () => {
    await userRepository.delete(userId1);

    const deletedUser = await userRepository.findById(userId1);
    expect(deletedUser).toBeNull();
  });

  it("another user's data remains untouched when account is deleted", async () => {
    await userRepository.delete(userId1);

    const remainingUser = await userRepository.findById(userId2);
    expect(remainingUser).not.toBeNull();
    expect(remainingUser?.email).toBe(email2);
  });
});
