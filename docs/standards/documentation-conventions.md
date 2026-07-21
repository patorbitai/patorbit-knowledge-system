# Documentation Conventions

This document defines the conventions for writing documentation within the Patorbit Knowledge System (PKS).

## Voice and Tone

- **Professional and Clear**: Write in a clear, concise, and professional manner.
- **Active Voice**: Use the active voice whenever possible. It is more direct and easier to understand.
  - _Good_: "The system processes requests."
  - _Bad_: "Requests are processed by the system."
- **Second Person**: Address the reader as "you".
  - _Example_: "You should first configure your environment."

## Structure

- **Start with a Summary**: Every document should begin with a brief summary or introduction that explains its purpose and what the reader will learn.
- **Use Headings**: Structure documents with clear, hierarchical headings.
- **Tables for Data**: Use tables to present structured data.
- **Code Blocks for Code**: Use code blocks with appropriate language identifiers for all code examples.

## Linking

- **Use Relative Links**: All internal links must be relative to ensure they work in any environment (local, staging, production).
- **Descriptive Link Text**: Link text should be descriptive of the target.
  - _Good_: `Refer to the [Versioning Conventions](versioning-conventions.md).`
  - _Bad_: `For versioning, click [here](versioning-conventions.md).`

## Admonitions

Use admonitions to highlight important information. MkDocs Material supports several types:

- `note`: General information.
- `tip`: Helpful advice or a best practice.
- `warning`: A point of caution.
- `danger`: Critical information that must be followed to avoid problems.

**Example:**

```markdown
!!! warning "Data Loss"
This action is irreversible and will result in data loss.
```
