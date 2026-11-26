import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { identityService } from "@/services/identity.service";
import { usageService } from "@/services/usage.service";
import { AIError } from "@/lib/ai/types";
import {
  InterviewNotFoundError,
  InterviewValidationError,
} from "@/services/interview-profile.service";

export interface InterviewCaller {
  userId: string;
  identityId: string;
}

/**
 * Resolve the authenticated caller and their ProfessionalIdentity.
 * Returns a 401 response when there is no session — every interview endpoint
 * is personal data and must be authenticated.
 */
export async function requireInterviewCaller(): Promise<
  { ok: true; caller: InterviewCaller } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized", message: "Please sign in." }, { status: 401 }),
    };
  }
  const identity = await identityService.ensureProfessionalIdentity(session.user.id);
  return { ok: true, caller: { userId: session.user.id, identityId: identity.id } };
}

/**
 * Run metered work: peek quota, execute, then consume on success only.
 * A failed AI call never burns the user's quota.
 */
export async function withMeteredUsage<T>(
  userId: string,
  feature: string,
  work: () => Promise<T>,
): Promise<{ ok: true; data: T; remaining: number } | { ok: false; response: NextResponse }> {
  const peek = await usageService.peekUsage(userId, feature);
  if (!peek.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "USAGE_LIMIT_REACHED",
          message: `You have used all ${peek.limit} of your ${feature.replace(/_/g, " ")} uses this month. Upgrade to Professional for unlimited access.`,
          usage: peek,
        },
        { status: 429 },
      ),
    };
  }

  const data = await work();
  await usageService.consumeUsage(userId, feature);
  return { ok: true, data, remaining: peek.remaining === -1 ? -1 : Math.max(0, peek.remaining - 1) };
}

/** Map domain errors to safe HTTP responses. */
export function interviewErrorResponse(err: unknown, context: string): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: err.issues[0]?.message ?? "Please check the submitted values.",
        issues: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      { status: 400 },
    );
  }
  if (err instanceof InterviewValidationError) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: err.message }, { status: 400 });
  }
  if (err instanceof InterviewNotFoundError) {
    return NextResponse.json({ error: "NOT_FOUND", message: err.message }, { status: 404 });
  }
  if (err instanceof AIError) {
    return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
  }
  console.error(`[api/interview] ${context}`, err);
  return NextResponse.json(
    { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
