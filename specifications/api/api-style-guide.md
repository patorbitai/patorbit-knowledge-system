# API Style Guide

## Purpose

This document defines the API style guide for the Patorbit platform. It standardizes resource naming, URI design, HTTP methods, status codes, headers, and response structures.

## Scope

This document covers all REST APIs across the platform.

---

## Resource Naming

### Resource Types

- **Collection**: A set of resources of the same type (plural noun).
- **Singleton**: A single resource (singular noun).

| Resource             | URI Pattern                      |
| -------------------- | -------------------------------- |
| Passports            | `/passports`                     |
| Passport             | `/passports/{passportId}`        |
| Passport Claims      | `/passports/{passportId}/claims` |
| Organizations        | `/organizations`                 |
| Organization Members | `/organizations/{orgId}/members` |
| User Profile         | `/profile` (singleton)           |

### Naming Rules

1. **Use plural nouns**: `/users` not `/user`.
2. **Use kebab-case for multi-word resources**: `/career-passports` not `/careerPassports`.
3. **Use lowercase**: `/organizations` not `/Organizations`.
4. **Use concrete nouns, not verbs**: `/claims` not `/create-claim`.
5. **Organize hierarchical resources with nesting**: `/passports/{passportId}/claims`.
6. **Maximum nesting depth of 3**: `/organizations/{orgId}/workspaces/{wsId}/members`.

## URI Design

### Base URI

```
https://api.patorbit.com/v1
```

### Common URI Patterns

| Pattern             | Example                               |
| ------------------- | ------------------------------------- |
| List collection     | `GET /v1/resources`                   |
| Get single resource | `GET /v1/resources/{id}`              |
| Create resource     | `POST /v1/resources`                  |
| Replace resource    | `PUT /v1/resources/{id}`              |
| Partial update      | `PATCH /v1/resources/{id}`            |
| Delete resource     | `DELETE /v1/resources/{id}`           |
| Nested resources    | `GET /v1/parents/{parentId}/children` |
| Resource actions    | `POST /v1/resources/{id}/actions`     |

### Actions

For operations that do not map cleanly to CRUD:

- Use `POST /v1/resources/{id}/actions/{action}`.
- Preferred over query parameter actions.

**Example**: Publish a passport:

```
POST /v1/passports/{passportId}/actions/publish
```

## HTTP Methods

| Method   | Semantics           | Idempotent         | Safe | Body  |
| -------- | ------------------- | ------------------ | ---- | ----- |
| `GET`    | Retrieve a resource | Yes                | Yes  | No    |
| `POST`   | Create a resource   | No (with key: yes) | No   | Yes   |
| `PUT`    | Replace a resource  | Yes                | No   | Yes   |
| `PATCH`  | Partial update      | No (with key: yes) | No   | Yes   |
| `DELETE` | Delete a resource   | Yes                | No   | Maybe |

## HTTP Status Codes

### Success Codes

| Code             | Usage                                      |
| ---------------- | ------------------------------------------ |
| `200 OK`         | Successful `GET`, `PUT`, `PATCH`, `DELETE` |
| `201 Created`    | Successful `POST` (resource created)       |
| `202 Accepted`   | Accepted for async processing              |
| `204 No Content` | Successful `DELETE` (no body)              |

### Client Error Codes

| Code                       | Usage                               |
| -------------------------- | ----------------------------------- |
| `400 Bad Request`          | Malformed request, validation error |
| `401 Unauthorized`         | Missing or invalid authentication   |
| `403 Forbidden`            | Authenticated but not authorized    |
| `404 Not Found`            | Resource not found                  |
| `405 Method Not Allowed`   | Unsupported HTTP method             |
| `409 Conflict`             | Resource conflict (e.g., duplicate) |
| `410 Gone`                 | Resource permanently removed        |
| `422 Unprocessable Entity` | Business validation failure         |
| `429 Too Many Requests`    | Rate limit exceeded                 |

### Server Error Codes

| Code                        | Usage                             |
| --------------------------- | --------------------------------- |
| `500 Internal Server Error` | Unexpected server error           |
| `502 Bad Gateway`           | Upstream service failure          |
| `503 Service Unavailable`   | Temporary overload or maintenance |
| `504 Gateway Timeout`       | Upstream service timeout          |

## Standard Headers

### Request Headers

| Header            | Description                   | Required                          |
| ----------------- | ----------------------------- | --------------------------------- |
| `Authorization`   | Bearer token or API key       | Yes (for auth endpoints)          |
| `Content-Type`    | Request body format           | For POST/PUT/PATCH                |
| `Accept`          | Response format               | Optional                          |
| `Idempotency-Key` | Idempotency key               | Recommended for mutating requests |
| `X-Request-Id`    | Request correlation ID        | Recommended                       |
| `X-Client-Id`     | Client application identifier | Optional                          |

### Response Headers

| Header                  | Description           |
| ----------------------- | --------------------- |
| `Content-Type`          | Response format       |
| `X-Request-Id`          | Echo of request ID    |
| `X-RateLimit-Limit`     | Rate limit quota      |
| `X-RateLimit-Remaining` | Remaining requests    |
| `X-RateLimit-Reset`     | Rate limit reset time |
| `Retry-After`           | Retry delay (for 429) |
| `Deprecation`           | API deprecation date  |
| `Sunset`                | API sunset date       |

## Request Bodies

- Use `application/json` as the default content type.
- All request bodies must be validated against the OpenAPI schema.
- Unknown fields should be ignored (not rejected) for forward compatibility.

## Response Bodies

- All responses follow the canonical envelope defined in [Request-Response Standards](request-response-standards.md).
- Success responses contain a `data` field.
- Error responses contain an `errors` field.
- Metadata (pagination, etc.) is in a `meta` field.

## References

- [Request-Response Standards](request-response-standards.md): Envelope format.
- [Naming Conventions](naming-conventions.md): Unified naming.
- [API Principles](api-principles.md): Foundational principles.
