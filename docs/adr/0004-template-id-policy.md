# ADR-0004: Template ID Policy

**Status:** Accepted — Frozen  
**Date:** 2026-08-07  
**Type:** Implementation ADR  
**Origin:** AGENTS.md constraint, referenced as "ADR-006" in memory (now formalized here)

---

## Context

Patorbit ships 22 resume templates. Each template is a React component registered in `src/app/resume-builder/templates.ts` under a stable `id` string. Template IDs flow into:

- Zustand store: `resume.templateId` (persisted in localStorage)
- URL params and share links (future)
- Analytics events
- User-facing template gallery display names

During Sprint 3, a refactor considered renaming template IDs for consistency (e.g., `"modern-clean"` → `"patorbit-modern"`). This was halted and formalized as a permanent constraint.

---

## Decision

**Template file names and template ID strings are frozen. They may never be renamed.**

### What "frozen" means

| Item | Frozen? | Reason |
|---|---|---|
| Template component file path (`dark-elegance.tsx`) | ✅ Yes | Renames break imports; no automated refactor is safe |
| Template `id` string in `templates.ts` | ✅ Yes | Persisted in user localStorage; renaming silently breaks user data |
| Template `name` (display label) | ❌ No | Display name is presentation-only |
| Template component internals | ❌ No | Visual redesigns are allowed |

### Current Template Registry (22 templates)

| ID | Display Name | Category |
|---|---|---|
| `modern-clean` | Modern Clean | Professional |
| `executive` | Executive | Executive |
| `split-vibrant` | Split Vibrant | Creative |
| `classic-serif` | Classic Serif | Professional |
| `tech-mono` | Tech Mono | Professional |
| `creative-burst` | Creative Burst | Creative |
| `compact-pro` | Compact Pro | Minimal |
| `corporate-blue` | Corporate Blue | Professional |
| `minimal-edge` | Minimal Edge | Minimal |
| `banner-bold` | Banner Bold | Creative |
| `sidebar-elegance` | Sidebar Elegance | Professional |
| `gradient-flow` | Gradient Flow | Creative |
| `academic-formal` | Academic Formal | Professional |
| `startup-vibe` | Startup Vibe | Creative |
| `dark-elegance` | Dark Elegance | Executive |
| `timeline-pro` | Timeline Pro | Professional |
| `premium-slate` | Premium Slate | Executive |
| `nature-green` | Nature Green | Minimal |
| `luxury-gold` | Luxury Gold | Executive |
| `swiss-design` | Swiss Design | Minimal |
| `scientific` | Scientific | Professional |
| `creative-portfolio` | Creative Portfolio | Creative |

### Adding New Templates

New templates may be added freely. The ID must be:
1. Globally unique within the registry
2. Kebab-case (`new-template-name`)
3. Descriptive of the visual character, not a version or revision number
4. Registered with a component file using the same name (`new-template-name.tsx`)

### Branded Template Aliases (Memory Reference)

Three templates carry Patorbit brand names used in marketing copy:

| ID | Brand Name |
|---|---|
| `modern-clean` | Patorbit Modern |
| `executive` | Patorbit Executive |
| `minimal-edge` | Patorbit ATS |

The brand names are marketing labels only. The `id` strings remain as above.

---

## Rationale

### Why IDs are frozen — not just a convention

The `resume.templateId` field is persisted in `localStorage` via the Zustand persist middleware. If a user has `templateId: "modern-clean"` stored and the ID is renamed to `patorbit-modern`:

1. On next load, `ResumePreview` dispatches `renderTemplate("patorbit-modern")`
2. No component is registered under that ID
3. The template falls back to a default or renders blank
4. **The user's template preference is silently lost**

There is no migration mechanism for localStorage values. A rename is therefore equivalent to a silent data loss event for existing users.

---

## Consequences

**Positive:**
- Zero risk of silent localStorage breakage for users
- Template IDs are stable anchors for analytics, share links, and future API contracts

**Constraints:**
- Developers must not rename template files or IDs under any circumstances, including "cleanup" refactors
- Code review must catch any PR that renames a template component file or changes a template's `id` value

---

## Cross-References

| Source | Relationship |
|---|---|
| `AGENTS.md` | Encodes this constraint as a project-wide rule |
| `src/app/resume-builder/templates.ts` | Registry that contains the frozen IDs |
| `src/store/resume-builder.ts` | Persists `resume.templateId` to localStorage |
| `src/components/resume/ResumePreview.tsx` | Dispatches by template ID to render component |
