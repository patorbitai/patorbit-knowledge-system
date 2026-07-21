# Pagination

## Purpose

This document defines the pagination strategy for the Patorbit API, ensuring consistent, performant, and predictable data retrieval for collection endpoints.

## Scope

This document covers cursor-based pagination, offset pagination, and their use cases.

---

## Pagination Strategy

**Primary**: Cursor-based pagination for all collection endpoints.

**Secondary**: Offset-based pagination for admin/back-office interfaces.

---

## Cursor-Based Pagination (Primary)

Cursor-based pagination provides consistent, performant pagination even when data is being inserted or deleted.

### Request Parameters

| Parameter      | Type    | Description                        | Default           |
| -------------- | ------- | ---------------------------------- | ----------------- |
| `page[size]`   | integer | Number of items to return per page | 20                |
| `page[cursor]` | string  | Cursor to the starting position    | None (first page) |

### Response Format

```json
{
  "data": [ ... ],
  "links": {
    "self": "https://api.patorbit.com/v1/claims?page[size]=20",
    "next": "https://api.patorbit.com/v1/claims?page[size]=20&page[cursor]=eyJpZCI6Ikx...",
    "prev": null
  },
  "meta": {
    "total": null,
    "pageSize": 20
  }
}
```

### Meta Fields

- `meta.total` is `null` for cursor-based pagination (total count is expensive to compute for large datasets).
- `meta.pageSize` reflects the actual page size returned.
- `links.next` is `null` when there are no more items.

## Offset-Based Pagination (Secondary)

Offset-based pagination is available for admin interfaces where total counts are needed (e.g., user management).

### Request Parameters

| Parameter      | Type    | Description              | Default                   |
| -------------- | ------- | ------------------------ | ------------------------- |
| `page[size]`   | integer | Number of items per page | 20                        |
| `page[number]` | integer | Page number (1-indexed)  | 1                         |
| `page[offset]` | integer | Offset from start        | Computed from page number |

### Response Format

```json
{
  "data": [ ... ],
  "links": {
    "self": "https://api.patorbit.com/v1/admin/users?page[size]=20&page[number]=1",
    "next": "https://api.patorbit.com/v1/admin/users?page[size]=20&page[number]=2",
    "prev": null
  },
  "meta": {
    "total": 1053,
    "pageSize": 20,
    "pageNumber": 1,
    "totalPages": 53
  }
}
```

## Performance Guidelines

| Use Case             | Pagination Type | Reason                                |
| -------------------- | --------------- | ------------------------------------- |
| Public API endpoints | Cursor-based    | Consistent, performant with live data |
| Admin/back-office    | Offset-based    | Total counts needed for UI            |
| Search results       | Cursor-based    | Consistent ranking                    |
| Export operations    | Cursor-based    | Efficient for large datasets          |

## References

- [Request-Response Standards](request-response-standards.md): Envelope and meta.
- [API Style Guide](api-style-guide.md): URI design.
- [Performance](../architecture/performance.md): Performance implications.
