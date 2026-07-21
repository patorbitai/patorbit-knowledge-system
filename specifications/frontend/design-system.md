# Design System

## Purpose

This document defines the design system for the Patorbit platform, establishing a shared visual language that ensures consistency, scalability, and maintainability across all frontend applications.

## Scope

This document covers design system principles, component philosophy, naming conventions, composition, extensibility, and governance.

---

## Principles

1. **Atomic, but Flexible**: Components are built from small, reusable primitives (tokens) that can be composed into larger patterns.

2. **Accessibility First**: Every component meets WCAG 2.2 AA at minimum.

3. **Design Token-Driven**: All visual properties (colors, spacing, typography) are defined as tokens, not hardcoded values.

4. **Composition Over Configuration**: Components are designed to be composed, not configured with complex props.

5. **Progressive Disclosure**: Complex features are hidden behind simple defaults and exposed through composition.

6. **Themeable**: All tokens define light and dark mode values.

---

## Component Hierarchy

```mermaid
graph TB
    subgraph "Foundation (Design Tokens)"
        DT_COLORS[Colors]
        DT_TYPE[Typography]
        DT_SPACE[Spacing]
        DT_RADIUS[Radius]
        DT_ELEV[Elevation]
        DT_MOTION[Motion]
    end

    subgraph "Primitives (Radix UI)"
        PR_BUTTON[Button]
        PR_INPUT[Input]
        PR_DIALOG[Dialog]
        PR_TABS[Tabs]
        PR_TOOLTIP[Tooltip]
        PR_POPOVER[Popover]
    end

    subgraph "Composites"
        CP_FORM[Form Controls]
        CP_TABLE[Data Table]
        CP_CARD[Card]
        CP_MODAL[Modal]
        CP_TOAST[Toast]
    end

    subgraph "Patterns"
        PT_PASSPORT[Passport Viewer]
        PT_RESUME[Resume Editor]
        PT_TIMELINE[Career Timeline]
        PT_UPLOAD[Evidence Uploader]
    end

    DT_COLORS --> PR_BUTTON
    DT_COLORS --> PR_INPUT
    DT_TYPE --> PR_BUTTON
    DT_TYPE --> PR_INPUT
    DT_SPACE --> PR_BUTTON
    DT_SPACE --> CP_FORM
    DT_RADIUS --> PR_DIALOG
    DT_ELEV --> PR_DIALOG
    PR_BUTTON --> CP_FORM
    PR_INPUT --> CP_FORM
    PR_DIALOG --> CP_MODAL
    PR_TOOLTIP --> CP_TOAST
    PR_TABS --> PT_PASSPORT
    CP_CARD --> PT_PASSPORT
    CP_TABLE --> PT_RESUME
    CP_MODAL --> PT_UPLOAD

    style DT_COLORS fill:#e3f2fd
    style DT_TYPE fill:#e3f2fd
    style DT_SPACE fill:#e3f2fd
    style PR_BUTTON fill:#90caf9
    style PR_INPUT fill:#90caf9
    style PR_DIALOG fill:#90caf9
    style CP_FORM fill:#64b5f6
    style CP_TABLE fill:#64b5f6
    style PT_PASSPORT fill:#42a5f5
    style PT_RESUME fill:#42a5f5
```

---

## Component Naming

| Pattern                    | Example                            |
| -------------------------- | ---------------------------------- |
| `{ComponentName}`          | `Button`, `Input`, `Dialog`        |
| `{ComponentName}{Variant}` | `ButtonPrimary`, `ButtonSecondary` |
| `{ComponentName}.{Part}`   | `Dialog.Header`, `Dialog.Body`     |

## Composition

- Components are composed using React's `children` prop or render props.
- Compound components allow for flexible layouts.
- Radix UI primitives are used for accessible, unstyled base components.

## Extensibility

- The design system is published as an npm package (`@patorbit/ui`).
- Components accept `className` and `style` props for ad-hoc overrides.
- The system is versioned independently of the application.

## Governance

- All new components require a design review and a documentation PR.
- Breaking changes to tokens or components require a major version bump.
- Component documentation is auto-generated from TypeScript types and JSDoc comments.

## References

- [Component Library](component-library.md): Complete component inventory.
- [Design Tokens](design-tokens.md): Token definitions.
- [Component Guidelines](component-guidelines.md): Component development standards.
