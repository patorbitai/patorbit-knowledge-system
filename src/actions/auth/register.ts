"use server";

import { registerSchema } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";
import { identityService } from "@/services/identity.service";

export type RegisterState = {
  success: boolean;
  message: string;
};

export async function registerUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const validated = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return {
      success: false,
      message: validated.error.issues[0].message,
    };
  }

  try {
    const user = await authService.register(
      validated.data.name,
      validated.data.email,
      validated.data.password
    );

    // Bootstrap the ProfessionalIdentity aggregate (ADR-007):
    // the identity is the canonical owner of all domain data.
    await identityService.ensureProfessionalIdentity(user.id);

    return {
      success: true,
      message: "Account created successfully.",
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