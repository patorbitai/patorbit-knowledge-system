# 012. Use Cloudflare for CDN and DNS

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires a global CDN for low-latency content delivery and robust DNS management.

## Decision Drivers

- Global performance
- DDoS protection
- Ease of management

## Considered Options

1. **Cloudflare**: Global CDN, great DDoS protection, unified DNS/CDN/WAF.
2. **AWS CloudFront + Route 53**: Tighter integration, but more expensive.
3. **Fastly**: Good CDN, but limited DNS capabilities.

## Decision Outcome

**Chosen option**: **Cloudflare**, for its excellent global performance, integrated security features, and simplicity.

## References

- [Infrastructure](../infrastructure.md)
