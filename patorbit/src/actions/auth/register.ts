"use server";

import { registerSchema } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";

export async function registerUser(formData: unknown) {
  const validated = registerSchema.safeParse(formData);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await authService.register(validated.data);

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong.",
    };
  }
}