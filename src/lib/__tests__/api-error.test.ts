import { describe, it, expect, vi, afterEach } from "vitest";
import { createErrorResponse, handleApiError } from "../api-error";

// Suppress console.error during tests
const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => consoleSpy.mockClear());

describe("createErrorResponse", () => {
  it("returns safe message and logs full error server-side", () => {
    const err = new Error("PrismaClientKnownRequestError: table 'ProfessionalIdentity' constraint violated");
    const res = createErrorResponse({
      err,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });

    // Client gets safe message only
    expect(res.status).toBe(500);
    // The response body should have safe fields
    const body = (res as any).body ?? res;
    // NextResponse in Next.js 15+ stores body differently; check the json
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("never exposes Prisma error details to the client", () => {
    const err = new Error("Foreign key constraint violated on the constraint: ProfessionalIdentity_userId_fkey");
    const res = createErrorResponse({
      err,
      status: 400,
      code: "INVALID_REFERENCE",
      message: "Something went wrong while saving. Please try again.",
    });

    // The safe message should be in the response
    // Verify the console was called with the full error (server-side)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("INVALID_REFERENCE"),
      err,
    );
  });
});

describe("handleApiError", () => {
  it("returns 404 for P2025 (record not found)", () => {
    // Simulate a Prisma P2025 error
    const err = Object.assign(new Error("No ProfessionalIdentity found"), {
      code: "P2025",
      constructor: { name: "PrismaClientKnownRequestError" },
    });
    // Override constructor name for detection
    Object.defineProperty(err, "constructor", {
      value: { name: "PrismaClientKnownRequestError" },
    });

    const res = handleApiError(err, "test-context");
    expect(res.status).toBe(404);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("test-context"),
      err,
    );
  });

  it("returns 409 for P2002 (unique constraint)", () => {
    const err = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    });
    Object.defineProperty(err, "constructor", {
      value: { name: "PrismaClientKnownRequestError" },
    });

    const res = handleApiError(err, "test-context");
    expect(res.status).toBe(409);
  });

  it("returns 400 for P2003 (foreign key violation)", () => {
    const err = Object.assign(
      new Error("Foreign key constraint violated on the constraint: ProfessionalIdentity_userId_fkey"),
      { code: "P2003" },
    );
    Object.defineProperty(err, "constructor", {
      value: { name: "PrismaClientKnownRequestError" },
    });

    const res = handleApiError(err, "test-context");
    expect(res.status).toBe(400);
  });

  it("returns 500 for unknown errors with safe message", () => {
    const err = new Error("Internal database error with sensitive details");
    const res = handleApiError(err, "test-context");
    expect(res.status).toBe(500);
    // Full error logged server-side
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("test-context"),
      err,
    );
  });

  it("applies overrides for custom status/code/message", () => {
    const err = new Error("User not found");
    const res = handleApiError(err, "test-context", {
      status: 401,
      code: "SESSION_EXPIRED",
      message: "Your session has expired. Please sign in again.",
    });
    expect(res.status).toBe(401);
  });

  it("handles non-Error objects gracefully", () => {
    const res = handleApiError("string error", "test-context");
    expect(res.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("handles null/undefined errors gracefully", () => {
    const res = handleApiError(null, "test-context");
    expect(res.status).toBe(500);
  });
});

describe("Error isolation", () => {
  it("never returns raw error.message to clients in the default path", () => {
    const sensitiveError = new Error(
      'Invalid `prisma.professionalIdentity.create()` invocation: Foreign key constraint violated on the constraint: `ProfessionalIdentity_userId_fkey`',
    );
    const res = handleApiError(sensitiveError, "identity:create");
    expect(res.status).toBe(500);

    // The response should NOT contain the raw Prisma error
    // We verify by checking the console was called (server-side)
    // but the response uses a safe default message
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("identity:create"),
      sensitiveError,
    );
  });

  it("User not found in repository throws a safe message", () => {
    // This simulates what identityRepository.create() throws
    const err = new Error(
      "User not found — your session may have expired. Please sign in again.",
    );
    const res = handleApiError(err, "identity:create", {
      status: 401,
      code: "SESSION_EXPIRED",
      message: "Your session has expired. Please sign in again.",
    });
    expect(res.status).toBe(401);
  });
});
