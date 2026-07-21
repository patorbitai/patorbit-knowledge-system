# Markdown Conventions

This document outlines the specific Markdown syntax conventions for the Patorbit Knowledge System (PKS). Adhering to these conventions ensures consistency and proper rendering.

## Headings

- Use ATX-style headings (`#`).
- The top-level heading should be an `<h1>` (a single `#`).
- Leave a blank line after each heading.

```markdown
# Heading 1

## Heading 2
```

## Lists

- Use hyphens (`-`) for unordered lists.
- Use `1.` for ordered lists. The numbers will be rendered sequentially regardless of the number you type.

## Code Blocks

- Use fenced code blocks (```) with a language identifier.
- For shell commands, use `sh`.

````markdown
```sh
npm install
```
````

## Bold and Italic

- Use asterisks for emphasis.
- `*italic*` for italic.
- `**bold**` for bold.

## Links

- Use reference-style links for repeated links to improve readability.
- For simple, non-repeated links, inline is acceptable.

## Tables

- Use pipes (`|`) to create tables.
- Align columns using colons (`:`).

```markdown
| Syntax    | Description |
| --------- | ----------- |
| Header    | Title       |
| Paragraph | Text        |
```

## Line Length

While not a strict rule enforced by tooling yet, aim for a line length of 80-100 characters for prose. This improves readability in raw Markdown files.
