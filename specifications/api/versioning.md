# Versioning

## Purpose

This document defines the API versioning strategy for the Patorbit platform, ensuring that changes can be introduced without breaking existing consumer integrations.

## Scope

This document covers API versioning, deprecation policy, and sunset policy.

---

## Versioning Strategy

**Strategy**: URI Versioning

- Version is included in the URL path: `https://api.patorbit.com/v1/{resource}`.
- Simple, explicit, and easy to route.

**Rationale**:

- **Clarity**: The version is immediately visible to the consumer.
- **Routing**: API gateways can easily route requests to the correct service version.
- **Caching**: URLs are unique per version, simplifying caching.

**Alternatives Considered**:

- **Header Versioning**: `Accept: application/vnd.patorbit.v1+json`. Less explicit, harder to cache.
- **Query Parameter Versioning**: `?version=1`. Pollutes query string, less common.

---

## Versioning Rules

### Major Version (`v1`, `v2`)

- **Trigger**: Breaking changes.
- **Examples of breaking changes**:
  - Removing or renaming an endpoint.
  - Removing or renaming a field.
  - Changing the type of a field.
  - Adding a required field.
  - Changing authentication or authorization rules.

### Minor Version (Implicit)

- **Trigger**: Backward-compatible changes.
- **Examples**:
  - Adding a new endpoint.
  - Adding a new optional field to a response.
  - Adding a new optional parameter to a request.
  - Changing the order of fields in a response.
  - Adding a new enum value.

### Patch Version (Internal)

- For bug fixes and security patches that do not affect the API contract.
- Not exposed to consumers.

---

## Deprecation Policy

When a feature or endpoint is to be removed, follow this process:

1. **Mark as Deprecated**:
   - Add a `Deprecated` flag in the OpenAPI specification.
   - Return a `Deprecation` header with the planned sunset date.
   - Log a warning for every request to the deprecated endpoint.

2. **Communicate**:
   - Announce the deprecation in the API changelog and developer portal.
   - Email registered developers.

3. **Transition Period**:
   - The deprecated feature remains functional for at least 6 months.
   - For critical security issues, this period may be shorter.

## Sunset Policy

After the transition period, the deprecated feature is removed (sunset).

1. **Sunset Date**: The date specified in the `Deprecation` header.
2. **Behavior**:
   - Requests to the sunset endpoint return `410 Gone`.
   - The error response includes a link to the new endpoint or migration guide.

---

## Backward Compatibility Rules

| Change Type                          | Backward Compatible? | Notes                        |
| ------------------------------------ | -------------------- | ---------------------------- |
| Adding an endpoint                   | Yes                  |                              |
| Adding an optional request parameter | Yes                  |                              |
| Adding a required request parameter  | **No (Breaking)**    | Requires a new version       |
| Removing a request parameter         | **No (Breaking)**    |                              |
| Adding a response field              | Yes                  |                              |
| Removing a response field            | **No (Breaking)**    |                              |
| Renaming a field                     | **No (Breaking)**    |                              |
| Changing a field's data type         | **No (Breaking)**    |                              |
| Changing validation rules            | Potentially breaking | More restrictive is breaking |

## Versioning Flow

```mermaid
graph TD
    V1[v1] -->|New feature| V1_1[v1 (with new endpoint)]
    V1_1 -->|Breaking change| V2[v2]
    V2 -->|Deprecate endpoint in v1| V1_Dep[v1 (with Deprecation header)]
    V1_Dep -->|Sunset period ends| V1_Sunset[v1 (endpoint returns 410)]

    style V1 fill:#81c784
    style V1_1 fill:#a5d6a7
    style V2 fill:#ef9a9a
    style V1_Dep fill:#ffcc80
    style V1_Sunset fill:#ff8a65
```

## References

- [API Style Guide](api-style-guide.md): URI design.
- [Changelog Policy](changelog-policy.md): How changes are communicated.
- [API Governance](api-governance.md): Review process for breaking changes.
