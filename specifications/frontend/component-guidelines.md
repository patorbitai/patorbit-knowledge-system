# Component Guidelines

## Purpose

Standards for component lifecycle, composition, states, accessibility, documentation, and testing.

## Composition

- Components are composed from Radix UI primitives.
- Compound components pattern (`Dialog.Trigger`, `Dialog.Content`).
- Customization via `className` and `style` props (for layout only — not token overrides).
- Semantic HTML elements as base.

## States

Every interactive component supports:

- **Default**: Normal resting state.
- **Hover**: Mouse-over visual feedback.
- **Focus**: Visible focus ring (keyboard navigation).
- **Active**: Pressed/selected state.
- **Disabled**: Reduced opacity, no pointer events.
- **Loading**: Spinner or skeleton substitute.
- **Error**: Error styling (form inputs).
- **Empty**: Empty state slot (data containers).

## Accessibility

- All components meet WCAG 2.2 AA.
- Keyboard interactions follow ARIA Authoring Practices Guide (APG).
- Focus management for modals, drawers, dialogs.
- Screen reader announcements for dynamic content.
- Color contrast ratios meet 4.5:1 (text) and 3:1 (non-text).

## Documentation

- Storybook stories for every component, variant, and state.
- Prop tables auto-generated from TypeScript types.
- Usage guidelines and code examples.
- Accessibility notes and keyboard interaction table.

## References

- [Component Library](component-library.md): Component inventory.
- [Accessibility](accessibility.md): Accessibility standards.
