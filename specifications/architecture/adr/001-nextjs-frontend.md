# 001. Use Next.js for Frontend Framework

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires a modern, performant, and scalable frontend framework. The framework must support server-side rendering (SSR), static site generation (SSG), and a rich ecosystem for tooling and libraries.

## Decision Drivers

- Performance (Core Web Vitals)
- Developer Experience
- SEO
- Scalability
- Community and Ecosystem

## Considered Options

1. **Next.js**: A React framework with SSR, SSG, and a strong community.
2. **Remix**: Another React framework with a focus on web fundamentals.
3. **SvelteKit**: A compiler-based framework with good performance.
4. **Vue (Nuxt.js)**: A mature framework with a strong community.
5. **Create React App**: Simple, but client-side rendering only.

## Decision Outcome

**Chosen option**: **Next.js**, because it offers the best balance of performance, developer experience, and ecosystem support. Its App Router and React Server Components align with our goal of building a modern, performant web application.

### Consequences

- **Positive**: Excellent performance out of the box, strong SEO, and a large talent pool of React developers.
- **Negative**: Requires a Node.js server for SSR, adding to infrastructure complexity compared to a pure SPA.

## Validation

The decision will be validated by achieving our Core Web Vitals targets in production.

## References

- [Frontend Architecture](../frontend-architecture.md)
