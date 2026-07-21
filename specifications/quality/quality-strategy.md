# Quality Strategy

## Purpose

Overall quality assurance strategy for the Patorbit platform.

## Scope

All quality activities across development, testing, release, and operations.

## Quadrants

| Quadrant                       | Focus                                | Automation |
| ------------------------------ | ------------------------------------ | ---------- |
| Business Facing (Support)      | Manual, exploratory, usability       | Low        |
| Business Facing (Technology)   | E2E, integration, API                | High       |
| Technology Facing (Support)    | Performance, security, accessibility | Medium     |
| Technology Facing (Technology) | Unit, component, contract            | Very High  |

## Risk-Based Testing

- Critical features (Passport, Claims, Evidence, Verification) get highest coverage.
- Authentication and payment flows are always fully tested.
- New AI features are tested against golden datasets.

## References

- [Testing Pyramid](testing-pyramid.md): Test distribution.
