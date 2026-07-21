# Responsive Design

## Breakpoints

| Token      | Width     | Device       |
| ---------- | --------- | ------------ |
| `--bp-xs`  | < 480px   | Small phones |
| `--bp-sm`  | >= 640px  | Large phones |
| `--bp-md`  | >= 768px  | Tablets      |
| `--bp-lg`  | >= 1024px | Laptops      |
| `--bp-xl`  | >= 1280px | Desktop      |
| `--bp-2xl` | >= 1536px | Ultra-wide   |

## Strategy

- **Mobile first**: Base styles target mobile, media queries add for larger screens.
- **Fluid grids**: CSS Grid + flexbox with relative units.
- **Fluid typography**: `clamp()` for responsive type sizes.
- **Images**: `max-width: 100%` + `object-fit`.
- **Touch targets**: Minimum 44x44px on mobile.

## Layout Adaptation

| Component    | Mobile            | Tablet            | Desktop        |
| ------------ | ----------------- | ----------------- | -------------- |
| Sidebar      | Bottom tab bar    | Collapsible icons | Full sidebar   |
| Data table   | Card list         | Responsive table  | Full table     |
| Multi-column | 1 column          | 2 columns         | 3+ columns     |
| Modal        | Full screen sheet | Centered modal    | Centered modal |

## References

- [Layouts](layouts.md): Layout adaptation.
- [Design Tokens](design-tokens.md): Breakpoint tokens.
