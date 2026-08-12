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
