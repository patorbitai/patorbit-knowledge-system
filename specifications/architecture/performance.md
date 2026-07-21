# Performance

## Purpose

This document defines the performance strategy for the Patorbit platform. It sets performance budgets, outlines optimization techniques, and ensures a fast, responsive experience for all users.

## Scope

This document covers performance budgets, optimization strategies, database performance, caching, compression, and profiling.

---

## Performance Targets

| Metric                            | Target (Good) | Target (Excellent) | Measurement         |
| --------------------------------- | ------------- | ------------------ | ------------------- |
| **API Response Time (P50)**       | < 100ms       | < 50ms             | Server-side metrics |
| **API Response Time (P95)**       | < 500ms       | < 200ms            | Server-side metrics |
| **API Response Time (P99)**       | < 1s          | < 500ms            | Server-side metrics |
| **Page Load (LCP)**               | < 2.5s        | < 1.8s             | Core Web Vitals     |
| **First Input Delay (FID)**       | < 100ms       | < 50ms             | Core Web Vitals     |
| **Cumulative Layout Shift (CLS)** | < 0.1         | < 0.05             | Core Web Vitals     |
| **Time to Interactive (TTI)**     | < 3s          | < 2s               | Lighthouse          |
| **First Contentful Paint (FCP)**  | < 1.8s        | < 1.0s             | Core Web Vitals     |

## Performance Budgets

| Resource                            | Budget                           |
| ----------------------------------- | -------------------------------- |
| **Total JavaScript Bundle**         | < 300 KB (gzip)                  |
| **Initial HTML**                    | < 50 KB                          |
| **Total CSS**                       | < 50 KB                          |
| **Fonts**                           | < 20 KB (self-hosted, subsetted) |
| **Images**                          | < 100 KB per image (lazy-loaded) |
| **API Payload (Initial Page Load)** | < 100 KB                         |

Budgets are tracked in CI and automatically fail the build if exceeded.

---

## Optimization Strategies

### Frontend Optimization

| Technique                        | Impact                                       |
| -------------------------------- | -------------------------------------------- |
| **Server-Side Rendering (SSR)**  | Faster LCP, better SEO                       |
| **Static Site Generation (SSG)** | Near-instant page loads for public pages     |
| **Code Splitting**               | Smaller initial bundles, lazy loading        |
| **Dynamic Imports**              | Load non-critical components on demand       |
| **Image Optimization**           | Next.js Image component with WebP/AVIF       |
| **Font Subsetting**              | Custom Inter font with only Latin characters |
| **Bundle Analysis**              | Regular review of bundle composition         |
| **Preloading Critical Assets**   | Preload fonts, key CSS, and hero images      |

### Backend Optimization

| Technique                    | Impact                                 |
| ---------------------------- | -------------------------------------- |
| **Caching (Multi-Layer)**    | Reduces database load, faster response |
| **Connection Pooling**       | Efficient database connection reuse    |
| **Query Optimization**       | Index tuning, query rewriting          |
| **Batch Processing**         | Bulk operations for batch workloads    |
| **Lazy Loading (Relations)** | Load related data only when needed     |
| **Asynchronous Processing**  | Offload heavy tasks to queues          |
| **Response Compression**     | gzip/brotli compression                |

### Database Optimization

| Technique                     | Impact                                         |
| ----------------------------- | ---------------------------------------------- |
| **Index Strategy**            | Proper indexes for common queries              |
| **Read Replicas**             | Offload read queries to replicas               |
| **Query Caching**             | Cache frequently executed queries              |
| **Partitioning**              | Time-based partitioning for large tables       |
| **Vacuuming/Analyzing**       | Regular maintenance for optimal query planning |
| **Denormalization (careful)** | Reduce JOINs for read-heavy queries            |

## Profiling

- **Real-User Monitoring (RUM)**: Core Web Vitals are collected from actual user devices.
- **Synthetic Monitoring**: Lighthouse CI runs on every PR against staging environment.
- **Server-Side Profiling**: CPU and memory profiles are generated for long-running requests.
- **Database Profiling**: Explain plans are reviewed for slow queries.

## Compression

| Layer              | Algorithm     | Notes                 |
| ------------------ | ------------- | --------------------- |
| **CDN**            | Brotli        | Static assets         |
| **API Responses**  | gzip / Brotli | Dynamic content       |
| **Image Uploads**  | WebP / AVIF   | On-the-fly conversion |
| **File Downloads** | gzip          | Resume exports        |

## References

- [Caching Strategy](caching-strategy.md): Caching for performance.
- [Frontend Architecture](frontend-architecture.md): Frontend-specific optimizations.
- [Data Architecture](data-architecture.md): Database performance considerations.
- [Cost Optimization](cost-optimization.md): Performance vs. cost trade-offs.
