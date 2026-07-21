# Layouts

## Purpose

This document defines the layout patterns for the Patorbit platform, ensuring consistent page structures across all application areas.

## Scope

This document covers marketing, dashboard, workspace, admin, authentication, and settings layouts.

---

## Layout Types

### 1. Marketing Layout

**Description**: For landing pages and public content.

**Structure**:

- **Header**: Marketing navigation.
- **Main**: Full-width content area.
- **Footer**: Marketing footer (multi-column).

**Use Cases**: Home page, pricing, blog.

### 2. Authentication Layout

**Description**: For login and registration pages.

**Structure**:

- **Main**: Centered card with form content.
- **Footer**: Minimal footer with only legal links.

**Use Cases**: Login, register, forgot password, MFA challenge.

### 3. Dashboard Layout

**Description**: The primary authenticated experience for individual users.

**Structure**:

- **Header**: Global header with user menu.
- **Sidebar**: Collapsible navigation sidebar.
- **Breadcrumbs**: Current location indicator.
- **Main**: Content area.
- **Overlay**: For modals, drawers.

**Use Cases**: Career Passport, Resume Builder, Settings.

### 4. Recruiter Workspace Layout

**Description**: A specialized layout for recruiter workflows.

**Structure**:

- **Header**: Recruiter-specific global header.
- **Sidebar**: Recruiter navigation.
- **Main**: Split-pane or full-width view for search results and candidate profiles.

**Use Cases**: Candidate search, shortlists, pipelines.

### 5. Organization Portal Layout

**Description**: For organization administrators managing their team.

**Structure**:

- **Header**: Organization-specific header.
- **Sidebar**: Organization navigation.
- **Main**: Content area with tabs for members, verification, settings.

**Use Cases**: Organization dashboard, member management, verification queue.

### 6. Admin Layout

**Description**: For platform administration.

**Structure**:

- **Header**: Admin minimal header.
- **Sidebar**: Admin navigation.
- **Main**: Full-width content area.

**Use Cases**: User management, platform settings, analytics.

## Responsive Behavior

| Layout    | Mobile (< 768px)                | Tablet (768–1024px)        | Desktop (> 1024px) |
| --------- | ------------------------------- | -------------------------- | ------------------ |
| Marketing | Single column, collapsible nav  | Stacked sections           | Full layout        |
| Dashboard | Sidebar collapses to bottom nav | Sidebar collapses to icons | Sidebar visible    |
| Recruiter | Full-width, no split            | Collapsible side panel     | Split pane or full |

## Layout Composition

- Layouts are composed using Next.js's Layout and Template components.
- Each layout is a separate file in the `(layout-group)` directory.
- Layouts can be nested (e.g., Dashboard Layout > Settings Layout).

## References

- [Routing](routing.md): Route groups and layouts.
- [Navigation](navigation.md): Navigation integration with layouts.
- [Responsive Design](responsive-design.md): Breakpoint implementation.
