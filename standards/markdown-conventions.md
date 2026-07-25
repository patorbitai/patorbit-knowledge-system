# Markdown Conventions

## Page Structure

- Frontmatter (when needed) under the `#` header, comma‑separated key‑value pairs.
- Use `---` as delimiter if frontmatter is used.
- Wrap headings in the file’s first `---` block (no blank line between header and first content line).

## Emphasis

- Use **bold** for emphasis.
- Use `*italic*` sparingly.
- Do not use `##` for emphasis.

## Lists

- Use unordered lists with `-` for items.
- Insert a blank line before and after block lists.

## Table Formatting

- Use pipelike GitHub‑flavored Markdown (pipes, colon align).
- Align headers with `:---`, `:---:`, or `---:`.
- No extra vertical space between rows.
- Add a header row for clarity.

## Images & Media

- Use relative paths only.
- Alt text required: `![alt text](./path/to/image.png)`.
- For diagrams, add a brief description in alt text or via a footnote.

## Internal Links

- Use `[text](./path.md)` to open same site.
- Use `[text](full-url)` for external links.
- Prefer descriptive link text over generic "click here".

## Abbreviations & Acronyms

- First occurrence: `(abbreviation)` with explanation.
- Subsequent uses: `(abbr.)` or use the term directly.

## URLs

- Use absolute URLs for external links (`https://...`).
- Relative links assumed within the domain.

## Notes & Sidebars

- Use `>` block quotes for quotation excerpts.
- Use `***` or `---` horizontal rule for visual separation.
