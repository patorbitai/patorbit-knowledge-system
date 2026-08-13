"use server";

import { authService } from "@/services/auth.service";

export async function verifyEmailAction(token: string) {
  if (!token) {
    return { success: false, message: "Missing verification token." };
  }

  try {
    await authService.verifyEmail(token);
    return { success: true, message: "Email successfully verified!" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Invalid or expired verification token.",
    };
  }
}

export async function resendVerificationAction(
  prevState: { success: boolean; message: string },
  formData: FormData
) {
  const email = formData.get("email");
  if (!email || typeof email !== "string") {
    return { success: false, message: "Please provide a valid email address." };
  }

  try {
    await authService.requestEmailVerification(email.trim());
    return {
      success: true,
      message: "If an account with that email exists, we have sent a new verification link.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to resend verification email.",
    };
  }
}
