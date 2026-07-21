# 010. Use OpenTelemetry for Observability

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires a standard approach to observability across all services.

## Decision Drivers

- Technology-agnostic
- Wide ecosystem support
- Single instrumentation library

## Considered Options

1. **OpenTelemetry**: Industry-standard, vendor-agnostic observability framework.
2. **Vendor-specific** (Datadog, New Relic): Proprietary, vendor lock-in.
3. **Custom implementation**: High maintenance cost.

## Decision Outcome

**Chosen option**: **OpenTelemetry**, for its industry-standard status and vendor-agnostic approach.

## References

- [Observability](../observability.md)
