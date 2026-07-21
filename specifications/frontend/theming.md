# Theming

## Theme Support

- **Light mode** (default): White backgrounds, dark text.
- **Dark mode**: Near-black backgrounds, light text.
- **High contrast mode**: Increased contrast for accessibility.

## Implementation

- CSS custom properties scoped to `:root` (light) and `.dark` (dark).
- Theme toggle detected via `prefers-color-scheme` media query, persisted in localStorage.
- Manual toggle in user settings overrides system preference.

## Token Override

```css
:root {
  --color-bg-default: #ffffff;
  --color-text-default: #111827;
}
.dark {
  --color-bg-default: #030712;
  --color-text-default: #f3f4f6;
}
```

## Future Themes

- System supports adding additional themes by adding new class scopes.
- Branded themes for enterprise customers (override primary color palette).

## References

- [Colors](colors.md): Light/dark palette.
- [Design Tokens](design-tokens.md): All tokens.
