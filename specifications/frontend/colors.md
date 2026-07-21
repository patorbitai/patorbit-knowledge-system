# Colors

## Purpose

This document defines the semantic color system for the Patorbit platform, ensuring consistent and accessible colors across all interfaces.

## Scope

This document covers primary, secondary, semantic, neutral, surface, and background colors, as well as dark mode and contrast standards.

---

## Semantic Color System

| Token                       | Light Mode | Dark Mode | Usage                     |
| --------------------------- | ---------- | --------- | ------------------------- |
| `--color-primary-default`   | #2563EB    | #3B82F6   | Primary buttons, links    |
| `--color-primary-fg`        | #FFFFFF    | #FFFFFF   | Text on primary           |
| `--color-primary-bg`        | #EFF6FF    | #1E3A8A   | Subtle primary background |
| `--color-secondary-default` | #4B5563    | #9CA3AF   | Secondary buttons         |
| `--color-secondary-fg`      | #FFFFFF    | #111827   | Text on secondary         |
| `--color-success-default`   | #16A34A    | #22C55E   | Success state             |
| `--color-warning-default`   | #F97316    | #F97316   | Warning state             |
| `--color-danger-default`    | #DC2626    | #EF4444   | Danger state              |
| `--color-text-default`      | #111827    | #F3F4F6   | Default body text         |
| `--color-text-secondary`    | #6B7280    | #9CA3AF   | Secondary text            |
| `--color-text-muted`        | #9CA3AF    | #6B7280   | Muted text                |
| `--color-text-disabled`     | #D1D5DB    | #4B5563   | Disabled text             |
| `--color-bg-default`        | #FFFFFF    | #030712   | Default background        |
| `--color-surface-default`   | #F9FAFB    | #111827   | Surface background        |
| `--color-border-default`    | #E5E7EB    | #374151   | Borders                   |
| `--color-focus-ring`        | #3B82F6    | #3B82F6   | Focus ring                |

## Color Palette

| Category      | Shade  | Light Mode | Dark Mode |
| ------------- | ------ | ---------- | --------- |
| **Primary**   | 50-900 | Blue       | Blue      |
| **Secondary** | 50-900 | Gray       | Gray      |
| **Success**   | 50-900 | Green      | Green     |
| **Warning**   | 50-900 | Orange     | Orange    |
| **Danger**    | 50-900 | Red        | Red       |

## Dark Mode

- **Strategy**: CSS custom properties with `:root` and `.dark` scopes.
- **Toggle**: System preference or manual toggle.
- **Implementation**: The theme provider applies the `.dark` class to the `<html>` element.

## Contrast

- **Standard**: All text must have a minimum contrast ratio of 4.5:1 against its background.
- **Large Text**: Large text (18pt+) must have a minimum contrast of 3:1.
- **UI Elements**: Non-text elements must have a minimum contrast of 3:1.
- **Validation**: Automated contrast checks are run in CI.

## References

- [Design System](design-system.md): Color usage in components.
- [Accessibility](accessibility.md): Contrast standards.
- [Theming](theming.md): Theme implementation.
