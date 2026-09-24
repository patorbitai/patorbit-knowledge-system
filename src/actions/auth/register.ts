"use server";

import { registerSchema } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";
import { identityService } from "@/services/identity.service";

export type RegisterState = {
  success: boolean;
  message: string;
  /** Direct verification URL — present only when no email provider is
   *  configured, so the wall can show a working link instead of claiming
   *  an email was sent that never leaves the server. */
  verificationUrl?: string | null;
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
      verificationUrl: user.verificationUrl ?? null,
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