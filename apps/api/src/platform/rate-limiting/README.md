# Rate Limiting

`RateLimitGuard` is the API's Nest throttling guard. It delegates request decisions to `@nestjs/throttler` and therefore uses the throttler configuration registered by the consuming application.

Register it as a route, controller, or global guard after importing `ThrottlerModule`. Limit and TTL behavior is owned by the configured throttler; this directory adds no independent storage or policy.
