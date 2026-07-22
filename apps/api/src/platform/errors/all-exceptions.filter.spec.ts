import { type ArgumentsHost,HttpException, HttpStatus } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AllExceptionsFilter } from "./all-exceptions.filter";

describe("AllExceptionsFilter", () => {
  const status = vi.fn();
  const json = vi.fn();
  const response = { status, json };
  const request = { url: "/claims/123", method: "GET" };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    status.mockReturnValue(response);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    status.mockReset();
    json.mockReset();
  });

  it("serializes an HTTP exception and its validation messages", () => {
    const exception = new HttpException(
      { message: ["name must not be empty"] },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    new AllExceptionsFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      path: "/claims/123",
      method: "GET",
      message: exception.message,
      errors: ["name must not be empty"],
    });
  });

  it("serializes an unknown error as an internal server error", () => {
    new AllExceptionsFilter().catch(new Error("unexpected failure"), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: "/claims/123",
        method: "GET",
        message: "unexpected failure",
      }),
    );
  });
});
