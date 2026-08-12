"use server";

import { authService } from "@/services/auth.service";

export type ResetState = {
  success: boolean;
  message: string;
};

export async function requestPasswordResetAction(
  prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = formData.get("email");
  if (!email || typeof email !== "string") {
    return { success: false, message: "Please provide a valid email address." };
  }

  try {
    await authService.requestPasswordReset(email.trim());
    return {
      success: true,
      message: "If an account with that email exists, we have sent a password reset link.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to request password reset.",
    };
  }
}

export async function resetPasswordAction(
  token: string,
  password: string,
  confirmPassword: string
): Promise<ResetState> {
  if (!token) {
    return { success: false, message: "Missing reset token." };
  }
  if (!password || password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters long." };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match." };
  }

  try {
    await authService.resetPassword(token, password);
    return {
      success: true,
      message: "Password has been successfully reset. You can now sign in.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reset password.",
    };
  }
}
