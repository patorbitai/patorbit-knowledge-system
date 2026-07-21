# Routing

## Purpose

This document defines the routing architecture for the Patorbit platform, including public routes, protected routes, nested routes, and navigation guards.

## Scope

This document covers all application routes, route groups, dynamic routes, and lazy loading strategies.

---

## Routing Strategy

**Framework**: Next.js App Router

**Principles**:

- **File-based**: Routes are defined by the file system.
- **Route Groups**: Group related routes into layouts without affecting the URL path.
- **Dynamic Segments**: Use `[id]` for dynamic routes.
- **Lazy Loading**: Automatic route-based code splitting.

---

## Route Groups

```
app/
  (marketing)/    # Public routes with marketing layout
    layout.tsx
    page.tsx
    pricing/
    contact/

  (auth)/         # Authentication routes with auth layout
    layout.tsx
    login/
    register/
    forgot-password/

  (dashboard)/    # Authenticated routes with dashboard layout
    layout.tsx
    dashboard/
    passport/
      [passportId]/
        edit/
    resume/
      [resumeId]/
    settings/
    billing/

  (recruiter)/    # Recruiter workspace routes
    layout.tsx
    search/
    candidates/
      [candidateId]/

  (organization)/ # Organization portal routes
    layout.tsx
    [orgId]/
      members/
      verification/

  (admin)/        # Admin portal routes
    layout.tsx
    users/
    organizations/
    analytics/
```

---

## Route Definitions

### Public Routes

| Route       | Description         |
| ----------- | ------------------- |
| `/`         | Marketing home page |
| `/pricing`  | Pricing plans       |
| `/contact`  | Contact form        |
| `/blog`     | Public blog         |
| `/login`    | Login page          |
| `/register` | Registration page   |

### Protected Routes

All routes under `/dashboard`, `/recruiter`, `/organization`, and `/admin` require authentication.

### Dynamic Routes

| Route                       | Description            |
| --------------------------- | ---------------------- |
| `/passport/[passportId]`    | View a passport        |
| `/resume/[resumeId]`        | View a resume          |
| `/organizations/[orgId]`    | Organization dashboard |
| `/candidates/[candidateId]` | View candidate profile |

---

## Navigation Guards

- **Middleware**: A `middleware.ts` file checks for authentication on protected routes.
- **Redirect**: Unauthenticated users accessing a protected route are redirected to `/login`.
- **Role-based Guards**: The middleware also checks for user roles and redirects if a user tries to access a route they are not authorized for (e.g., a normal user trying to access `/recruiter`).

## Breadcrumbs

- **Strategy**: Generate breadcrumbs based on the route hierarchy.
- **Implementation**: A shared `useBreadcrumbs` hook traverses the route tree to build the breadcrumb path.

## Lazy Loading

- **Automatic**: Next.js automatically code-splits pages.
- **Manual**: Use `next/dynamic` for heavy components that are conditionally rendered (e.g., modals, rich text editors).

## References

- [Application Architecture](application-architecture.md): Route groups and layouts.
- [Navigation](navigation.md): How routing maps to navigation elements.
- [Frontend Security](frontend-security.md): Route protection.
