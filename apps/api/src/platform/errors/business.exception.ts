import { HttpException, HttpStatus } from "@nestjs/common";

import { ERROR_CODES } from "./errors.constants";

export class BusinessException extends HttpException {
  constructor(
    message: string,
    code: string = ERROR_CODES.BUSINESS_ERROR,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: Record<string, unknown>
  ) {
    super({ message, code, statusCode: status, ...details }, status);
  }
}

export class EntityNotFoundException extends BusinessException {
  constructor(entity: string, id?: string) {
    const msg = id ? `${entity} with id "${id}" not found` : `${entity} not found`;
    super(msg, ERROR_CODES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

export class EntityConflictException extends BusinessException {
  constructor(message: string) {
    super(message, ERROR_CODES.CONFLICT, HttpStatus.CONFLICT);
  }
}

export class ForbiddenOperationException extends BusinessException {
  constructor(message = "Forbidden") {
    super(message, ERROR_CODES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }
}

export class ValidationException extends BusinessException {
  readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>, message = "Validation failed") {
    super(message, ERROR_CODES.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, {
      fields: fieldErrors,
    });
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message = "Unauthorized") {
    super(message, ERROR_CODES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }
}

export class RateLimitException extends BusinessException {
  readonly retryAfter: number;

  constructor(retryAfter: number, message = "Too many requests") {
    super(message, ERROR_CODES.RATE_LIMIT, HttpStatus.TOO_MANY_REQUESTS, {
      retryAfter,
    });
    this.retryAfter = retryAfter;
  }
}
