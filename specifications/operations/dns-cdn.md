# DNS & CDN

## Purpose

DNS and CDN strategy for global performance and reliability.

## DNS

- **Provider**: Cloudflare DNS.
- **Routing**: Geo-based routing to nearest region.
- **Failover**: Automated DNS failover on regional outage.
- **Records**: Managed via Terraform.

## CDN

- **Provider**: Cloudflare CDN.
- **Caching**:
  - Static assets: 1 year TTL.
  - Public pages: 1 hour TTL.
  - API responses (public): 5 min TTL.
- **WAF**: DDoS protection, OWASP rules.
- **Certificates**: Managed by Cloudflare.

## References

- [Infrastructure Overview](infrastructure-overview.md): Edge layer.
