import { describe, it, expect, beforeEach } from "vitest";
import { authService } from "../auth.service";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("Auth Verification & Password Reset Service", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testName = "Test User";
  const testPassword = "Password123!";

  beforeEach(async () => {
    // Clean up test user & tokens if any
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {});
    await prisma.verificationToken.deleteMany({ where: { identifier: `verify_${testEmail}` } }).catch(() => {});
    await prisma.verificationToken.deleteMany({ where: { identifier: `reset_${testEmail}` } }).catch(() => {});
  });

  it("registration creates verification token and sends email", async () => {
    const user = await authService.register(testName, testEmail, testPassword);
    expect(user).toBeTruthy();
    expect(user.email).toBe(testEmail);
    expect(user.emailVerified).toBeNull();

    // Check verification token exists in DB
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { identifier: `verify_${testEmail}` },
    });
    expect(tokenRecord).toBeTruthy();
    expect(tokenRecord?.token).toBeTruthy();
  });

  it("verification succeeds with valid token and marks email verified", async () => {
    await authService.register(testName, testEmail, testPassword);
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { identifier: `verify_${testEmail}` },
    });
    expect(tokenRecord).toBeTruthy();

    const result = await authService.verifyEmail(tokenRecord!.token);
    expect(result.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user?.emailVerified).not.toBeNull();

    // Used token should be deleted (single-use)
    const secondTry = authService.verifyEmail(tokenRecord!.token);
    await expect(secondTry).rejects.toThrow();
  });

  it("expired verification token fails", async () => {
    const token = "expired-token-123";
    const expiredDate = new Date(Date.now() - 1000 * 60); // 1 min ago

    await prisma.verificationToken.create({
      data: {
        identifier: `verify_${testEmail}`,
        token,
        expires: expiredDate,
      },
    });

    const verifyPromise = authService.verifyEmail(token);
    await expect(verifyPromise).rejects.toThrow();
  });

  it("resend verification email succeeds, replaces old token, and protects email enumeration", async () => {
    // Non-existing email should succeed silently
    const nonExistRes = await authService.requestEmailVerification("nonexistent-resend@example.com");
    expect(nonExistRes.success).toBe(true);

    // Existing unverified email
    await authService.register(testName, testEmail, testPassword);
    const token1Record = await prisma.verificationToken.findFirst({
      where: { identifier: `verify_${testEmail}` },
    });
    expect(token1Record).toBeTruthy();

    // Request resend verification
    const resendRes = await authService.requestEmailVerification(testEmail);
    expect(resendRes.success).toBe(true);

    // Verify old token is replaced by a new token
    const token2Record = await prisma.verificationToken.findFirst({
      where: { identifier: `verify_${testEmail}` },
    });
    expect(token2Record).toBeTruthy();
    expect(token2Record?.token).not.toBe(token1Record?.token);

    // Old token should no longer exist (single replacement)
    const oldTokenCheck = await prisma.verificationToken.findUnique({
      where: { token: token1Record!.token },
    });
    expect(oldTokenCheck).toBeNull();
  });

  it("password reset request behaves safely for non-existing and existing email", async () => {
    // Non-existing email should succeed silently without error
    const nonExistResult = await authService.requestPasswordReset("nonexistent@example.com");
    expect(nonExistResult.success).toBe(true);

    // Existing email
    await authService.register(testName, testEmail, testPassword);
    const resetResult = await authService.requestPasswordReset(testEmail);
    expect(resetResult.success).toBe(true);

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { identifier: `reset_${testEmail}` },
    });
    expect(tokenRecord).toBeTruthy();
  });

  it("valid reset token changes password and is single-use", async () => {
    await authService.register(testName, testEmail, testPassword);
    await authService.requestPasswordReset(testEmail);

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { identifier: `reset_${testEmail}` },
    });
    expect(tokenRecord).toBeTruthy();

    const newPassword = "NewPassword456!";
    const res = await authService.resetPassword(tokenRecord!.token, newPassword);
    expect(res.success).toBe(true);

    // Verify password updated
    const updatedUser = await prisma.user.findUnique({ where: { email: testEmail } });
    const match = await bcrypt.compare(newPassword, updatedUser!.passwordHash);
    expect(match).toBe(true);

    // Single-use check: reusing token fails
    const reusePromise = authService.resetPassword(tokenRecord!.token, "AnotherPass123!");
    await expect(reusePromise).rejects.toThrow();
  });

  it("expired password reset token fails", async () => {
    const token = `expired-reset-token-${Date.now()}`;
    await prisma.verificationToken.deleteMany({ where: { token } }).catch(() => {});
    await prisma.verificationToken.create({
      data: {
        identifier: `reset_${testEmail}`,
        token,
        expires: new Date(Date.now() - 1000),
      },
    });

    const resetPromise = authService.resetPassword(token, "NewPass123!");
    await expect(resetPromise).rejects.toThrow();
  });
});
