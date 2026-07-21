# Filtering

## Purpose

This document defines the standard filtering syntax for the Patorbit API, enabling consumers to request specific subsets of data.

## Scope

This document covers filter syntax, operators, and cross-resource filtering.

---

## Filtering Syntax

Use `filter` query parameters to specify filtering criteria.

### Simple Filters

```
GET /v1/claims?filter[status]=verified
GET /v1/claims?filter[type]=employment
GET /v1/claims?filter[identityId]=user_abc123
```

### Multiple Filters (AND)

Multiple `filter` parameters are combined with AND logic:

```
GET /v1/claims?filter[status]=verified&filter[type]=employment
```

### Operators

| Operator              | Syntax                          | Description           | Example                               |
| --------------------- | ------------------------------- | --------------------- | ------------------------------------- |
| Equals                | `filter[field]=value`           | Exact match           | `filter[status]=verified`             |
| Not Equals            | `filter[field][ne]=value`       | Not equal             | `filter[status][ne]=rejected`         |
| Greater Than          | `filter[field][gt]=value`       | Greater than          | `filter[startDate][gt]=2023-01-01`    |
| Greater Than or Equal | `filter[field][gte]=value`      | Greater than or equal | `filter[startDate][gte]=2023-01-01`   |
| Less Than             | `filter[field][lt]=value`       | Less than             | `filter[endDate][lt]=2024-01-01`      |
| Less Than or Equal    | `filter[field][lte]=value`      | Less than or equal    | `filter[createdAt][lte]=2024-01-01`   |
| In                    | `filter[field][in]=val1,val2`   | In a list             | `filter[status][in]=verified,pending` |
| Contains              | `filter[field][contains]=value` | Substring match       | `filter[title][contains]=Engineer`    |
| Exists                | `filter[field][exists]=true`    | Field is not null     | `filter[endDate][exists]=true`        |

### Date Filters

Dates are in ISO 8601 format (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`).

```
GET /v1/claims?filter[startDate][gte]=2023-01-01&filter[startDate][lte]=2023-12-31
```

### Text Search

For full-text search, use the `q` parameter:

```
GET /v1/claims?q=software+engineer
```

## Filtering by Related Resources

```
GET /v1/claims?filter[organization.name]=Acme+Corp
```

This filters claims by an attribute of a related resource (organization name in this example).

## References

- [Pagination](pagination.md): Combined with pagination.
- [Sorting](sorting.md): Combined with sorting.
- [API Style Guide](api-style-guide.md): Query parameter conventions.
