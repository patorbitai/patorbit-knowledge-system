# Application Architecture

## Purpose

This document defines the frontend application architecture for the Patorbit platform, describing the shell, feature modules, shared infrastructure, and layer boundaries.

## Scope

This document covers the top-level application structure and the responsibilities of each architectural layer.

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Shell"
        APP[App Shell]
        RT[Router]
        AUTH[Auth Provider]
        LAYOUT[Layouts]
        I18N[I18n Provider]
        THEME[Theme Provider]
    end

    subgraph "Feature Modules"
        FM_AUTH[Authentication]
        FM_PAS[Career Passport]
        FM_RES[Resume Builder]
        FM_VER[Verification]
        FM_ORG[Organizations]
        FM_REC[Recruiter]
        FM_AI[AI Workspace]
        FM_ADMIN[Admin Portal]
        FM_BILL[Billing]
    end

    subgraph "Shared Infrastructure"
        SH_DS[Design System]
        SH_HOOKS[Shared Hooks]
        SH_UTILS[Utilities]
        SH_TYPES[Shared Types]
    end

    subgraph "Service Layer"
        SVC_API[API Client]
        SVC_AUTH[Auth Service]
        SVC_CACHE[Cache Service]
        SVC_ANALYTICS[Analytics Service]
    end

    subgraph "State Layer"
        ST_QUERY[Server State (React Query)]
        ST_CLIENT[Client State (Zustand)]
        ST_URL[URL State (Params)]
        ST_FORM[Form State]
    end

    APP --> FM_AUTH
    APP --> FM_PAS
    APP --> FM_RES
    FM_AUTH --> SH_DS
    FM_PAS --> SH_DS
    FM_PAS --> SVC_API
    FM_PAS --> ST_QUERY
    SVC_API --> ST_QUERY
    SH_HOOKS --> ST_CLIENT
    APP --> SH_HOOKS

    style APP fill:#e3f2fd
    style FM_AUTH fill:#bbdefb
    style FM_PAS fill:#bbdefb
    style FM_RES fill:#bbdefb
    style FM_VER fill:#bbdefb
    style FM_ORG fill:#bbdefb
    style FM_REC fill:#bbdefb
    style SH_DS fill:#90caf9
    style SH_HOOKS fill:#90caf9
    style SVC_API fill:#64b5f6
    style ST_QUERY fill:#42a5f5
    style ST_CLIENT fill:#2196f3
```

---

## Layer Descriptions

### Shell Layer

The Shell layer is the top-level application container. It provides:

- **App Shell**: Root layout with navigation, header, and footer.
- **Router**: Next.js App Router for page routing.
- **Auth Provider**: Context-based authentication state management.
- **Layout Provider**: Responsive layout switching (dashboard, workspace, admin).
- **Theme Provider**: CSS custom properties for light/dark mode.
- **I18n Provider**: Internationalization context.

### Feature Modules

Each feature module is a self-contained directory within `src/features/`. Features are organized by business domain:

- **`features/auth/`**: Login, registration, password reset.
- **`features/passport/`**: Career passport management.
- **`features/resume/`**: Resume builder and export.
- **`features/verification/`**: Claim verification and evidence submission.
- **`features/organizations/`**: Organization management and workspaces.
- **`features/recruiter/`**: Candidate search, shortlisting, outreach.
- **`features/ai/`**: AI-assisted features (resume analysis, skill suggestions).
- **`features/admin/`**: Platform administration.
- **`features/billing/`**: Subscription management and payment.

Each feature module contains:

```
components/
hooks/
services/
types/
[page files]
```

### Shared Infrastructure

- **Design System**: Component library from the design system specification.
- **Shared Hooks**: Reusable hooks for common patterns (useDebounce, useMediaQuery, etc.).
- **Utilities**: Date formatting, string manipulation, validation helpers.
- **Shared Types**: TypeScript types shared across features.

### Service Layer

- **API Client**: Centralized HTTP client with authentication, retries, and error handling.
- **Auth Service**: Authentication token management and refresh.
- **Cache Service**: Client-side caching for API responses.
- **Analytics Service**: Event tracking and analytics.

### State Layer

Detailed in [State Management](state-management.md):

- **Server State**: React Query for server-managed data with caching and invalidation.
- **Client State**: Zustand for shared UI state.
- **URL State**: Search params for filters, pagination, sorting.
- **Form State**: React Hook Form for form state management.

## Folder Structure

```
src/
  app/                    # Next.js App Router pages
    (auth)/               # Auth routes (login, register)
    (dashboard)/          # Authenticated routes
    (marketing)/          # Public marketing pages
  features/               # Feature modules
    auth/
    passport/
    resume/
  shared/                 # Shared infrastructure
    components/           # Design system components
    hooks/                # Shared hooks
    services/             # API client, services
    types/                # Shared types
    utils/                # Utility functions
  styles/                 # Global styles
```

## References

- [Routing](routing.md): Route definitions and guards.
- [State Management](state-management.md): State layer details.
- [Data Fetching](data-fetching.md): Service layer interactions.
- [Component Library](component-library.md): Design system components.
