# API Architecture

## Purpose

This document defines the API strategy for the Patorbit platform, covering REST APIs, GraphQL, webhooks, versioning, and other cross-cutting concerns. It ensures a consistent, secure, and developer-friendly API ecosystem.

## Scope

This document covers all public, private, and internal APIs.

---

## API Strategy

- **Primary API**: A comprehensive RESTful API for all platform interactions.
- **GraphQL**: Considered for future use in the Recruiter Workspace for complex, nested data queries.
- **Webhooks**: For real-time event notifications to external partners and enterprise customers.
- **Asynchronous APIs**: For long-running operations like resume generation or AI analysis, using a job-based polling or webhook callback model.

---

## REST API Design

### Principles

- **Resource-Oriented**: APIs are designed around resources (e.g., `passports`, `claims`).
- **Standard HTTP Methods**: `GET` (retrieve), `POST` (create), `PUT`/`PATCH` (update), `DELETE` (delete).
- **JSON:API Specification**: Adhere to JSON:API for request/response formats to ensure consistency.
- **Stateless**: All requests are self-contained and do not rely on server session state.

### URI Structure

```
/api/v1/{resource}/{id}
/api/v1/{parent_resource}/{id}/{child_resource}
```

**Examples**:

- `GET /api/v1/passports/{passportId}`
- `POST /api/v1/passports/{passportId}/claims`
- `GET /api/v1/organizations/{orgId}/members`

### Versioning

- **Strategy**: URI-based versioning (`/v1`, `/v2`).
- **Policy**:
  - Major version (`v1`) for breaking changes.
  - Minor changes (new fields) are backward compatible.
  - Deprecated endpoints return a `Warning` header.

### Pagination

- **Strategy**: Cursor-based pagination for all collection endpoints.
- **Query Parameters**: `page[size]` and `page[after]`.
- **Response**: Includes `links` object with `self`, `next`, and `prev` URLs.

```json
{
  "links": {
    "self": "/api/v1/claims?page[size]=10",
    "next": "/api/v1/claims?page[size]=10&page[after]=abcde",
    "prev": null
  },
  "data": [ ... ]
}
```

### Filtering

- **Strategy**: Use a `filter` query parameter.
- **Syntax**: `filter[attribute]=value`
- **Example**: `GET /api/v1/claims?filter[status]=verified`

### Sorting

- **Strategy**: Use a `sort` query parameter.
- **Syntax**: `sort=attribute` (ascending) or `sort=-attribute` (descending).
- **Example**: `GET /api/v1/claims?sort=-createdAt`

### Sparse Fieldsets

- **Strategy**: Allow clients to request only the fields they need.
- **Syntax**: `fields[{resource}]=field1,field2`
- **Example**: `GET /api/v1/passports/{id}?fields[passports]=status,version`

### Compound Documents (Includes)

- **Strategy**: Allow including related resources in a single request.
- **Syntax**: `include=resource1,resource2`
- **Example**: `GET /api/v1/claims/{id}?include=evidence,verifications`

---

## GraphQL Strategy (Future)

- **Use Case**: Recruiter Workspace, where complex, nested queries for candidate profiles are common.
- **Implementation**: A separate GraphQL endpoint will be exposed, backed by a dedicated resolver service that composes data from backend services. This avoids over-fetching and reduces client-side complexity.

---

## Webhook Architecture

- **Events**: Publish key domain events to registered webhook endpoints.
- **Security**:
  - All payloads are signed with a shared secret (`X-Patorbit-Signature`).
  - Endpoints must use HTTPS.
- **Retries**: Exponential backoff for failed deliveries.
- **Management**: Users can register and manage their webhooks via the developer portal.

---

## Cross-Cutting Concerns

### Idempotency

- All `POST`, `PUT`, `PATCH`, and `DELETE` requests support idempotency.
- Clients can send an `Idempotency-Key` header with a unique UUID.
- The server caches the response for the first request with that key and returns it for subsequent requests.

### Rate Limiting

- **Strategy**: Token bucket algorithm.
- **Limits**: Applied per user, per IP, and per API key.
- **Response**: `429 Too Many Requests` with `Retry-After` header.

### Error Model

- **HTTP Status Codes**: Use standard HTTP status codes (4xx for client errors, 5xx for server errors).
- **Error Response Body**:

```json
{
  "errors": [
    {
      "status": "422",
      "source": { "pointer": "/data/attributes/email" },
      "title": "Invalid Attribute",
      "detail": "Email must be a valid email address."
    }
  ]
}
```

---

## OpenAPI Specification

- **Contract**: A single, comprehensive OpenAPI 3.1 specification is the source of truth for all APIs.
- **Generation**: Generated from code annotations (NestJS decorators).
- **Distribution**: Published to a developer portal with interactive documentation (Swagger UI / Redoc).

## References

- [Backend Architecture](backend-architecture.md): Service implementation of API controllers.
- [Security Architecture](security-architecture.md): Security controls for the API.
- [Authentication](authentication.md): Token and session management.
- [Authorization](authorization.md): Permission enforcement.
