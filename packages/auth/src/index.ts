// ── Types ──────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  type: "access" | "refresh";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  roleId: string | null;
  profile: {
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface AuthSession {
  id: string;
  userId: string;
  deviceType: string | null;
  isTrusted: boolean;
  createdAt: Date;
  expiresAt: Date;
}

// ── Validation Schemas ──────────────────────────────

import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  name: z.string().min(1, "Name is required").max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

// ── Password Service ─────────────────────────────────

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const passwordService = {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async verify(password: string, hash: string): Promise<boolean> {
    // Constant-time comparison via bcrypt
    return bcrypt.compare(password, hash);
  },
};

// ── Auditing ──────────────────────────────────────────

export type AuditAction =
  | "user.register"
  | "user.login"
  | "user.login.failed"
  | "user.logout"
  | "user.refresh"
  | "user.verify_email"
  | "user.password_reset"
  | "user.password_change"
  | "user.lockout"
  | "session.revoke"
  | "session.list";

export const AUDIT_OUTCOME = {
  SUCCESS: "success",
  FAILURE: "failure",
} as const;

// ── Lockout Config ────────────────────────────────────

export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_DURATION_MINUTES = 15;
