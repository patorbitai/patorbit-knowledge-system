import { HttpStatus } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import {
  BusinessException,
  EntityConflictException,
  EntityNotFoundException,
  ForbiddenOperationException,
} from "./business.exception";

describe("business exceptions", () => {
  it("serializes a typed business error", () => {
    const exception = new BusinessException("Invalid transition", "INVALID_TRANSITION");

    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.getResponse()).toEqual({
      message: "Invalid transition",
      code: "INVALID_TRANSITION",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it("includes an entity identifier in not-found errors", () => {
    const exception = new EntityNotFoundException("Claim", "claim-1");

    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.getResponse()).toEqual({
      message: 'Claim with id "claim-1" not found',
      code: "ENTITY_NOT_FOUND",
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it.each([
    [new EntityConflictException("Already exists"), HttpStatus.CONFLICT, "ENTITY_CONFLICT"],
    [new ForbiddenOperationException(), HttpStatus.FORBIDDEN, "FORBIDDEN"],
  ])("uses the expected status and code", (exception, expectedStatus, expectedCode) => {
    expect(exception.getStatus()).toBe(expectedStatus);
    expect(exception.getResponse()).toMatchObject({ code: expectedCode, statusCode: expectedStatus });
  });
});
