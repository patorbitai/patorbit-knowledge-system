import bcrypt from "bcryptjs";
import crypto from "crypto";
import { userRepository } from "@/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/services/email.service";

export class AuthService {
  async register(
    name: string,
    email: string,
    password: string
  ) {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await userRepository.create({
      name,
      email,
      passwordHash,
    });

    // Generate email verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: `verify_${email}`,
        token,
        expires,
      },
    });

    await emailService.sendVerificationEmail(email, token);

    return user;
  }

  async verifyEmail(token: string) {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || !record.identifier.startsWith("verify_")) {
      throw new Error("Invalid or expired verification token");
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      throw new Error("Verification token has expired");
    }

    const email = record.identifier.replace("verify_", "");

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete token (single-use)
    await prisma.verificationToken.delete({ where: { token } });

    return { success: true, email };
  }

  async requestPasswordReset(email: string) {
    const user = await userRepository.findByEmail(email);
    // Do not reveal whether email exists (silent return)
    if (!user) {
      return { success: true };
    }

    // Delete any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset_${email}` },
    }).catch(() => {});

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: `reset_${email}`,
        token,
        expires,
      },
    });

    await emailService.sendPasswordResetEmail(email, token);

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!record || !record.identifier.startsWith("reset_")) {
      throw new Error("Invalid or expired password reset token");
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
      throw new Error("Password reset token has expired");
    }

    const email = record.identifier.replace("reset_", "");
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete token (single-use)
    await prisma.verificationToken.delete({ where: { token } });

    return { success: true };
  }
}

export const authService = new AuthService();
