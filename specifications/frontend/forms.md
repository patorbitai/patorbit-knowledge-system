# Forms

## Purpose

Form architecture, validation, autosave, error states, and wizard patterns.

## Architecture

- **Library**: React Hook Form for performant forms.
- **Validation**: Zod schemas for type-safe validation.
- **Components**: All form controls in the design system support `error`, `helperText`, `disabled`, `required` props.

## Validation

- **Client-side**: Zod schema validation on blur and submit.
- **Server-side**: API validation errors mapped back to fields.
- **Cross-field**: Password confirmation, date range ordering.
- **Async**: Unique email check on blur.

## Autosave

- Strategy: Debounced save on field change (1.5s).
- Indicator: "Saving..." / "Saved" status badge.
- Conflict: Server version mismatch detected, user prompted.

## Wizard Flows

- Multi-step forms use the Stepper component.
- Each step validates before advancing.
- Step state is preserved on navigation away and return.
- Final step submits all collected data.

## Error States

- Inline errors below each field.
- Summary error at top of form for screen readers.
- API errors displayed as toast or banner.

## References

- [Validation](validation.md): Frontend validation strategy.
- [Component Library](component-library.md): Form controls.
