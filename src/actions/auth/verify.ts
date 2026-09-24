"use server";

import { authService } from "@/services/auth.service";

export async function verifyEmailAction(token: string, email?: string) {
  if (!token) {
    return { success: false as const, message: "Missing verification token." };
  }

  try {
    const res = await authService.verifyEmail(token, email);
    if (res.already) {
      return {
        success: true as const,
        already: true,
        message: "This email is already verified — sign in to continue.",
      };
    }
    return {
      success: true as const,
      already: false,
      message: "Email verified — you're all set to sign in.",
    };
  } catch (error) {
    return {
      success: false as const,
      already: false,
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
    return { success: false, message: "Please provide a valid email address.", verificationUrl: null };
  }

  try {
    const res = await authService.requestEmailVerification(email.trim());
    return {
      success: true,
      message: "If an account with that email exists, we have sent a new verification link.",
      // Non-null only when no email provider is configured — callers surface
      // the direct link so the resend is never a silent dead end.
      verificationUrl: res.verificationUrl ?? null,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to resend verification email.",
      verificationUrl: null,
    };
  }
}
