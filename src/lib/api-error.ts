import { NextResponse } from "next/server";

/**
 * Safe API error responses.
 *
 * All errors are logged server-side with full technical detail.
 * Clients receive only safe, human-readable messages.
 * NEVER return Prisma errors, SQL errors, stack traces, constraint names,
 * table names, internal IDs, or infrastructure details to clients.
 */

/** Shape returned to the client. */
interface SafeErrorBody {
  error: string;
  message: string;
}

/** Options for createErrorResponse. */
interface ErrorOptions {
  /** The caught error — full details logged server-side only. */
  err: unknown;
  /** HTTP status code. Defaults to 500. */
  status?: number;
  /** Stable error code for the frontend (e.g. "PROFILE_SAVE_FAILED"). */
  code?: string;
  /** Safe user-facing message. If omitted, a generic default is used. */
  message?: string;
}

/**
 * Create a safe error response.
 *
 * - Logs the full error details to the server console (for developers).
 * - Returns only a safe, human-readable message to the client.
 * - Never exposes Prisma errors, SQL errors, stack traces, or internal details.
 */
export function createErrorResponse({
  err,
  status = 500,
  code = "INTERNAL_ERROR",
  message,
}: ErrorOptions): NextResponse<SafeErrorBody> {
  // Log full error server-side for debugging
  console.error(`[api-error] ${code}:`, err);

  const safeMessage =
    message || "Something went wrong. Please try again.";

  return NextResponse.json({ error: code, message: safeMessage }, { status });
}

/**
 * Classify a caught error and return a safe response with appropriate status.
 *
 * Use this when you want automatic status-code classification based on
 * common error patterns (Prisma not-found, unique constraint, etc.).
 */
export function handleApiError(
  err: unknown,
  context: string,
  overrides?: Partial<Pick<ErrorOptions, "status" | "code" | "message">>,
): NextResponse<SafeErrorBody> {
  console.error(`[api-error] ${context}:`, err);

  // Prisma P2025: Record not found
  if (isPrismaError(err, "P2025")) {
    return createErrorResponse({
      err,
      status: 404,
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
    });
  }

  // Prisma P2002: Unique constraint violation
  if (isPrismaError(err, "P2002")) {
    return createErrorResponse({
      err,
      status: 409,
      code: "CONFLICT",
      message: "A record with this information already exists.",
    });
  }

  // Prisma P2003: Foreign key constraint violation
  if (isPrismaError(err, "P2003")) {
    return createErrorResponse({
      err,
      status: 400,
      code: "INVALID_REFERENCE",
      message: "Something went wrong while saving. Please try again.",
    });
  }

  // Default: generic server error (with optional overrides)
  return createErrorResponse({
    err,
    status: overrides?.status ?? 500,
    code: overrides?.code ?? "INTERNAL_ERROR",
    message: overrides?.message ?? "Something went wrong. Please try again.",
  });
}

/** Check if an error is a PrismaKnownRequestError with a specific code. */
function isPrismaError(err: unknown, code: string): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  return e.code === code && e.constructor?.name === "PrismaClientKnownRequestError";
}
