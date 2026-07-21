# OpenAPI Structure

## Purpose

This document defines the structure and organization of the OpenAPI 3.1 specifications for the Patorbit platform, ensuring consistency and reusability.

## Scope

This document covers the repository structure, reusable schemas, components, tags, examples, and security schemes.

---

## File Structure

The OpenAPI specification is split into multiple files for better organization and reusability.

```
openapi/
  patorbit-api.v1.yml     # Main entry point
  info.yml                  # API info block
  servers.yml               # Server definitions
  tags.yml                  # Tag definitions
  paths/                    # Endpoint definitions
    passports.yml
    claims.yml
    organizations.yml
    ...
  components/               # Reusable components
    schemas/
      passport.yml
      claim.yml
      error.yml
      meta.yml
    parameters/
      pagination.yml
      filtering.yml
    headers/
      rate-limiting.yml
    responses/
      404-not-found.yml
      429-too-many-requests.yml
    security-schemes/
      oauth2.yml
      api-key.yml
```

---

## Reusable Schemas

- **Resource Schemas**: Define each resource (e.g., Passport, Claim) in its own file under `components/schemas`.
- **Envelope Schemas**: Define standard request/response envelopes (e.g., `JsonApiDocument`, `ErrorDocument`).
- **Common Types**: Schemas for common types like `UUID`, `Timestamp`, `Email` are defined and reused.

## Components

- **Parameters**: Common parameters (pagination, sorting, filtering) are defined once.
- **Headers**: Common headers (rate limiting, idempotency) are defined as reusable components.
- **Responses**: Common error responses (404, 429) are defined and referenced.
- **Security Schemes**: All authentication methods are defined as reusable security schemes.

## Tags

- Tags are used to group endpoints by resource.
- A central `tags.yml` file defines all tags with descriptions.

## Examples

- Every schema and response includes at least one example.
- Examples are realistic and reflect common use cases.
- Examples are validated against the schema.

## Security Schemes

| Scheme   | Type     | Flow                         |
| -------- | -------- | ---------------------------- |
| `OAuth2` | `oauth2` | Authorization Code with PKCE |
| `ApiKey` | `http`   | Bearer token                 |

## Validation

The OpenAPI specification is validated on every commit using tools like `openapi-cli` to ensure correctness and adherence to standards.

## References

- [API Style Guide](api-style-guide.md): How style guide is reflected in OpenAPI.
- [SDK Guidelines](sdk-guidelines.md): Generating SDKs from OpenAPI.
- [API Testing](api-testing.md): Using OpenAPI for contract testing.
