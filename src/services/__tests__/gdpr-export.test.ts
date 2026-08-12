import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/user/export/route";
import { userRepository } from "@/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Mock next-auth getServerSession
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth";

describe("GDPR Data Export API", () => {
  const testEmail = `gdpr-${Date.now()}@example.com`;
  let userId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {});
    const user = await userRepository.create({
      name: "GDPR User",
      email: testEmail,
      passwordHash: await bcrypt.hash("Password123!", 10),
    });
    userId = user.id;
  });

  it("rejects unauthenticated requests with 401", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns complete user data export with correct headers and excludes passwords/tokens", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: userId, email: testEmail, name: "GDPR User" },
    });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");
    expect(res.headers.get("Cache-Control")).toBe("no-store, private");

    const data = await res.json();
    expect(data.exportVersion).toBe("1.0.0");
    expect(data.profile.email).toBe(testEmail);
    expect(data.profile.name).toBe("GDPR User");

    // Ensure password hash and secrets are excluded
    expect(data.profile.passwordHash).toBeUndefined();
    expect(data.passwordHash).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("Password123!");
  });
});
