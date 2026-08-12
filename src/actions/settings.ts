"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userRepository } from "@/repositories/user.repository";

export type SettingsState = {
  success: boolean;
  message: string;
};

export async function updateProfile(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized. Please sign in." };
  }

  const name = formData.get("name");
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { success: false, message: "Name cannot be empty." };
  }

  try {
    await userRepository.update(session.user.id, { name: name.trim() });
    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update profile.",
    };
  }
}

export async function deleteAccount(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized. Please sign in." };
  }

  const confirmation = formData.get("confirmation");
  if (confirmation !== "DELETE") {
    return { success: false, message: "Please type DELETE to confirm account deletion." };
  }

  try {
    await userRepository.delete(session.user.id);
    return { success: true, message: "Account deleted successfully." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete account.",
    };
  }
}
