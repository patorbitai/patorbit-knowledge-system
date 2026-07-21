# Error Model

## Purpose

This document defines the standard error model for the Patorbit API, ensuring consistent, actionable error responses across all endpoints.

## Scope

This document covers error response format, error codes, and error categories.

---

## Error Response Format

All errors follow a consistent JSON:API-compatible structure:

```json
{
  "errors": [
    {
      "id": "err_abc123",
      "status": "422",
      "code": "VALIDATION_ERROR",
      "title": "Validation Error",
      "detail": "Email must be a valid email address.",
      "source": {
        "pointer": "/data/attributes/email"
      },
      "meta": {
        "timestamp": "2026-07-21T14:30:00Z",
        "traceId": "trac_abc123",
        "correlationId": "corr_xyz789"
      }
    }
  ]
}
```

### Fields

| Field                         | Description                              | Required              |
| ----------------------------- | ---------------------------------------- | --------------------- |
| `errors[].id`                 | Unique error identifier (opaque).        | Yes                   |
| `errors[].status`             | HTTP status code as a string.            | Yes                   |
| `errors[].code`               | Patorbit-specific error code.            | Yes                   |
| `errors[].title`              | Short, human-readable summary.           | Yes                   |
| `errors[].detail`             | Detailed explanation.                    | Yes                   |
| `errors[].source.pointer`     | JSON pointer to the source of the error. | For validation errors |
| `errors[].source.parameter`   | Query parameter name causing the error.  | For parameter errors  |
| `errors[].meta.timestamp`     | Error timestamp (UTC).                   | Yes                   |
| `errors[].meta.traceId`       | Trace ID for correlation.                | Yes                   |
| `errors[].meta.correlationId` | Business process correlation ID.         | Optional              |

---

## Error Codes

### Authentication (401)

| Code                      | Title                   | Detail                                    |
| ------------------------- | ----------------------- | ----------------------------------------- |
| `AUTHENTICATION_REQUIRED` | Authentication Required | The request requires authentication.      |
| `TOKEN_EXPIRED`           | Token Expired           | The access token has expired.             |
| `TOKEN_INVALID`           | Invalid Token           | The access token is invalid or malformed. |
| `MFA_REQUIRED`            | MFA Required            | Multi-factor authentication is required.  |

### Authorization (403)

| Code                         | Title                      | Detail                                              |
| ---------------------------- | -------------------------- | --------------------------------------------------- |
| `INSUFFICIENT_SCOPE`         | Insufficient Scope         | The token does not have the required scopes.        |
| `INSUFFICIENT_ROLE`          | Insufficient Role          | The user does not have the required role.           |
| `RESOURCE_ACCESS_DENIED`     | Resource Access Denied     | The user does not have access to this resource.     |
| `ORGANIZATION_ACCESS_DENIED` | Organization Access Denied | The user does not have access to this organization. |

### Validation (400/422)

| Code               | Title            | Detail                                     |
| ------------------ | ---------------- | ------------------------------------------ |
| `VALIDATION_ERROR` | Validation Error | One or more fields failed validation.      |
| `INVALID_FORMAT`   | Invalid Format   | The request body is not valid JSON.        |
| `MISSING_FIELD`    | Missing Field    | A required field is missing.               |
| `INVALID_VALUE`    | Invalid Value    | A field has an invalid value.              |
| `TOO_LARGE`        | Too Large        | The request body exceeds the maximum size. |
| `INVALID_QUERY`    | Invalid Query    | The query parameters are invalid.          |

### Resource Errors (404)

| Code                         | Title                      | Detail                                |
| ---------------------------- | -------------------------- | ------------------------------------- |
| `RESOURCE_NOT_FOUND`         | Resource Not Found         | The requested resource was not found. |
| `RELATED_RESOURCE_NOT_FOUND` | Related Resource Not Found | A related resource was not found.     |

### Conflict (409)

| Code                 | Title              | Detail                                        |
| -------------------- | ------------------ | --------------------------------------------- |
| `RESOURCE_CONFLICT`  | Resource Conflict  | The request conflicts with the current state. |
| `DUPLICATE_RESOURCE` | Duplicate Resource | The resource already exists.                  |

### Rate Limiting (429)

| Code                      | Title                            | Detail                                     |
| ------------------------- | -------------------------------- | ------------------------------------------ |
| `RATE_LIMIT_EXCEEDED`     | Rate Limit Exceeded              | Too many requests. See Retry-After header. |
| `RATE_LIMIT_ORGANIZATION` | Organization Rate Limit Exceeded | Organization-level rate limit exceeded.    |

### Server Errors (500)

| Code                     | Title                  | Detail                                  |
| ------------------------ | ---------------------- | --------------------------------------- |
| `INTERNAL_ERROR`         | Internal Error         | An unexpected error occurred.           |
| `SERVICE_UNAVAILABLE`    | Service Unavailable    | The service is temporarily unavailable. |
| `EXTERNAL_SERVICE_ERROR` | External Service Error | An upstream service failed.             |
| `DATABASE_ERROR`         | Database Error         | A database operation failed.            |

---

## Error Categories

| Category       | HTTP Status | Codes                                                       |
| -------------- | ----------- | ----------------------------------------------------------- |
| Authentication | 401         | `AUTHENTICATION_REQUIRED`, `TOKEN_EXPIRED`, `TOKEN_INVALID` |
| Authorization  | 403         | `INSUFFICIENT_SCOPE`, `INSUFFICIENT_ROLE`                   |
| Validation     | 400, 422    | `VALIDATION_ERROR`, `MISSING_FIELD`, `INVALID_VALUE`        |
| Not Found      | 404         | `RESOURCE_NOT_FOUND`                                        |
| Conflict       | 409         | `RESOURCE_CONFLICT`, `DUPLICATE_RESOURCE`                   |
| Rate Limit     | 429         | `RATE_LIMIT_EXCEEDED`                                       |
| Server         | 500, 503    | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`                     |

## References

- [API Style Guide](api-style-guide.md): HTTP status codes.
- [Request-Response Standards](request-response-standards.md): Response envelope.
- [API Security](api-security.md): Security errors.
