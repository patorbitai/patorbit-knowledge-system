# Rate Limiting

## Purpose

This document defines the rate limiting strategy for the Patorbit API, protecting the platform from abuse and ensuring fair usage.

## Scope

This document covers rate limits per user, per organization, per API key, burst handling, and response headers.

---

## Rate Limit Tiers

| Tier                     | Request Limit   | Time Window |
| ------------------------ | --------------- | ----------- |
| **Anonymous IP**         | 100 requests    | 1 minute    |
| **Authenticated User**   | 1,000 requests  | 1 minute    |
| **Organization**         | 10,000 requests | 1 minute    |
| **API Key (Free)**       | 1,000 requests  | 1 hour      |
| **API Key (Enterprise)** | Custom          | Custom      |

## Algorithm

**Sliding Window with Token Bucket**:

- A token bucket for each user/IP with a defined capacity and refill rate.
- Each request consumes one token.
- Allows for short bursts of traffic up to the bucket capacity.

## Response Headers

When a request is rate-limited, the API returns `429 Too Many Requests` with the following headers:

| Header                  | Description                                               | Example    |
| ----------------------- | --------------------------------------------------------- | ---------- |
| `X-RateLimit-Limit`     | The maximum number of requests allowed in the time window | 1000       |
| `X-RateLimit-Remaining` | The number of requests remaining                          | 0          |
| `X-RateLimit-Reset`     | UNIX timestamp when the limit resets                      | 1690000900 |
| `Retry-After`           | Number of seconds to wait before retrying                 | 60         |

## Burst Handling

- The token bucket algorithm naturally handles short bursts up to the bucket capacity.
- Sustained high traffic will be throttled.

## Scope of Limiting

- Rate limits are applied at the API Gateway level.
- Limits are shared across all endpoints for a given user/IP.
- Specific, expensive endpoints (e.g., AI analysis) may have lower, separate rate limits.

## References

- [API Principles](api-principles.md): Security and scalability principles.
- [Error Model](error-model.md): 429 error response.
- [Cost Optimization](../architecture/cost-optimization.md): Using rate limits to control costs.
