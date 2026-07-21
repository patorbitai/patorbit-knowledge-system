# Design Tokens

## Purpose

This document defines the design tokens for the Patorbit design system. Tokens are the atomic values that define the visual language: spacing, radius, elevation, motion, sizing, breakpoints, transitions, and z-index.

## Scope

This document covers all design token categories and their values.

---

## Spacing Scale

Tokens follow a 4px base unit scale:

| Token        | Value (px) | Value (rem) | Example          |
| ------------ | ---------- | ----------- | ---------------- |
| `--space-0`  | 0px        | 0rem        | No spacing       |
| `--space-1`  | 4px        | 0.25rem     | Tight gap        |
| `--space-2`  | 8px        | 0.5rem      | Button spacing   |
| `--space-3`  | 12px       | 0.75rem     | Input padding    |
| `--space-4`  | 16px       | 1rem        | Card padding     |
| `--space-5`  | 20px       | 1.25rem     | Section gap      |
| `--space-6`  | 24px       | 1.5rem      | Heading margin   |
| `--space-8`  | 32px       | 2rem        | Section margin   |
| `--space-10` | 40px       | 2.5rem      | Page section gap |
| `--space-12` | 48px       | 3rem        | Large spacing    |
| `--space-16` | 64px       | 4rem        | Page padding     |

## Border Radius

| Token           | Value  | Usage            |
| --------------- | ------ | ---------------- |
| `--radius-none` | 0      | Sharp edges      |
| `--radius-sm`   | 4px    | Inputs, buttons  |
| `--radius-md`   | 8px    | Cards, dialogs   |
| `--radius-lg`   | 12px   | Modals, drawers  |
| `--radius-xl`   | 16px   | Large containers |
| `--radius-full` | 9999px | Pills, avatars   |

## Elevation (Shadows)

| Token           | Usage                     |
| --------------- | ------------------------- |
| `--elevation-0` | No shadow (flat elements) |
| `--elevation-1` | Cards, inputs             |
| `--elevation-2` | Dropdowns, popovers       |
| `--elevation-3` | Modals, dialogs (small)   |
| `--elevation-4` | Modals, drawers (large)   |
| `--elevation-5` | Toasts, floating elements |

## Motion / Duration

| Token              | Duration | Usage              |
| ------------------ | -------- | ------------------ |
| `--motion-instant` | 0ms      | Opacity changes    |
| `--motion-fast`    | 100ms    | Micro-interactions |
| `--motion-normal`  | 200ms    | Transitions        |
| `--motion-slow`    | 300ms    | Page transitions   |
| `--motion-slower`  | 500ms    | Animations         |

## Sizing

| Token       | Value | Usage                    |
| ----------- | ----- | ------------------------ |
| `--size-xs` | 20px  | Badges, tags             |
| `--size-sm` | 32px  | Small buttons, inputs    |
| `--size-md` | 40px  | Standard buttons, inputs |
| `--size-lg` | 48px  | Large buttons, inputs    |
| `--size-xl` | 56px  | XL inputs                |

## Breakpoints

| Token      | Value  | Device       |
| ---------- | ------ | ------------ |
| `--bp-xs`  | 480px  | Small phones |
| `--bp-sm`  | 640px  | Large phones |
| `--bp-md`  | 768px  | Tablets      |
| `--bp-lg`  | 1024px | Laptops      |
| `--bp-xl`  | 1280px | Desktop      |
| `--bp-2xl` | 1536px | Ultra-wide   |

## Z-Index

| Token          | Value | Usage                 |
| -------------- | ----- | --------------------- |
| `--z-dropdown` | 100   | Dropdowns, popovers   |
| `--z-sticky`   | 200   | Sticky headers        |
| `--z-drawer`   | 300   | Side drawers          |
| `--z-modal`    | 400   | Modals, dialogs       |
| `--z-toast`    | 500   | Toasts, notifications |

## References

- [Design System](design-system.md): Token usage in components.
- [Colors](colors.md): Color tokens.
- [Typography](typography.md): Typography tokens.
- [Theming](theming.md): Token overrides for theming.
