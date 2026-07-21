# Validation

## Purpose

Defines the frontend validation strategy for all user inputs.

## Layers

| Layer           | Tool                                  | Scope                                   |
| --------------- | ------------------------------------- | --------------------------------------- |
| HTML5           | `required`, `type=email`, `minlength` | Basic browser validation                |
| Zod Schema      | Schema per form                       | Field types, formats, cross-field rules |
| React Hook Form | Form state                            | Submission, blur, error display         |
| API             | NestJS pipes                          | Server-side enforcement                 |

## Rules

| Rule        | Example                      |
| ----------- | ---------------------------- |
| Required    | Email required               |
| Format      | Email pattern, phone pattern |
| Length      | Min/max characters           |
| Range       | Number range                 |
| Pattern     | Regex match                  |
| Cross-field | Start date < end date        |
| Async       | Email uniqueness             |

## References

- [Forms](forms.md): Form implementation.
- [Data Validation](../data/data-validation.md): Server-side validation.
