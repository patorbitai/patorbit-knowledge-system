# Metadata Conventions

Metadata blocks are **optional** but recommended for documentation files. They are placed in **YAML frontmatter** between `---` delimiters at the **very beginning** of a file.

## Required Keys (when metadata is present)

| Key       | Type   | Description                                     | Example                |
| --------- | ------ | ----------------------------------------------- | ---------------------- |
| `title`   | string | Document title (matches the `#` heading)        | `"Naming conventions"` |
| `type`    | string | Document category: `guide`, `spec`, `adr`, etc. | `"guide"`              |
| `updated` | date   | Date of last revision (ISO 8601)                | `2026-07-25`           |

## Optional Keys

| Key       | Type   | Description                              | Example               |
| --------- | ------ | ---------------------------------------- | --------------------- |
| `status`  | string | Draft status: `draft`, `review`, `final` | `"final"`             |
| `author`  | string | Original author’s username or email      | `"team@patorbit.com"` |
| `version` | string | Semantic version of the doc              | `"1.0.0"`             |

## Example

```yaml
---
title: 'Naming conventions'
type: 'guide'
updated: 2026-07-25
status: 'final'
author: 'team@patorbit.com'
version: '1.0.0'
---
```

## Notes

- Do not include blank lines inside the metadata block.
- Strings should be double‑quoted if they contain colons or special characters.
- Dates must be in ISO 8601 format (`YYYY-MM-DD`).
