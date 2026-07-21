# Accessibility

## Purpose

Defines accessibility standards to meet WCAG 2.2 AA compliance across the platform.

## Standards

- **Target**: WCAG 2.2 Level AA.
- **Testing**: Automated (axe-core) + manual (keyboard, screen reader).
- **Tools**: eslint-plugin-jsx-a11y, axe-core in CI, Playwright a11y checks.

## Keyboard Navigation

- All interactive elements are reachable via Tab.
- Focus order follows DOM order (visual order).
- Visible focus ring on all focusable elements.
- Arrow key navigation for tab lists, radio groups, menus.
- Escape closes modals, dialogs, popovers.
- Enter/Space activates buttons, links.

## ARIA

- Landmarks: `main`, `nav`, `complementary`, `contentinfo`.
- Live regions for dynamic content updates.
- `aria-expanded` for collapsible elements.
- `aria-current` for active navigation.
- `aria-label` for icon-only buttons.
- `aria-describedby` for error messages.

## Screen Readers

- All images have alt text (decorative: `alt=""`).
- Form inputs have associated labels.
- Error announcements via `role="alert"`.
- Loading states announced.
- Dynamic content changes announced via `aria-live`.

## Color and Contrast

- Text contrast: 4.5:1 minimum (AA).
- Large text (18pt+): 3:1 minimum.
- Non-text elements: 3:1 minimum.
- Focus indicators: 3:1 contrast against adjacent colors.

## Motion

- `prefers-reduced-motion`: Respect user preference, disable animations.
- Essential motion (progress bars, loading spinners) still animates but at reduced intensity.

## References

- [Component Guidelines](component-guidelines.md): Component accessibility.
- [Colors](colors.md): Contrast requirements.
- [Animations](animations.md): Motion system.
