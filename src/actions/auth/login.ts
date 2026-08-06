"use server";

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

/**
 * Server action to check if a user is currently authenticated.
 * Used by client components to determine auth state without client-side session fetching.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
