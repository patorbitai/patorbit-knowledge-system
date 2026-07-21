# Sorting

## Purpose

This document defines the standard sorting syntax for the Patorbit API, enabling consumers to order collection results.

## Scope

This document covers sorting syntax, multi-field sorting, and default ordering.

---

## Sorting Syntax

Use the `sort` query parameter to specify the sort order.

### Single Field Sort

```
GET /v1/claims?sort=createdAt
```

Prefix with `-` for descending order:

```
GET /v1/claims?sort=-createdAt
```

### Multi-Field Sort

Separate multiple sort fields with a comma:

```
GET /v1/claims?sort=-status,createdAt
```

This sorts by `status` descending, then by `createdAt` ascending.

## Supported Fields

Each endpoint documents which fields are available for sorting. Typically:

- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `startDate` (date)
- `endDate` (date)
- `name` / `title` (string)
- `status` (enum)
- `confidenceScore` (number)

## Default Sorting

If no `sort` parameter is provided, the default sort order is `-createdAt` (most recent first).

## Multi-Resource Sorting

For complex queries across resources, specify the sort field with a resource prefix:

```
GET /v1/search/candidates?sort=-verifiedClaimCount
```

## References

- [Pagination](pagination.md): Combined with sorting.
- [Filtering](filtering.md): Combined with filtering.
- [Request-Response Standards](request-response-standards.md): Response format.
