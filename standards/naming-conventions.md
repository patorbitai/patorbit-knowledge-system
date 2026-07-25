# Naming Conventions

## Files & Directories

- Use **kebab-case** for files (`file-name.md`).
- Use **snake_case** for directories (`directory_name/`).
- Use `_` prefix for partials or include files not meant for direct access.
- Avoid spaces in filenames.

## Documentation Titles

- Use **Sentence case** for titles (`# Naming conventions`).
- Use the imperative mood for procedural titles ("Set up the environment").

## Internal IDs & Anchors

- Use **kebab-case** for link anchors (`#naming-conventions`).
- Use **UPPER_SNAKE_CASE** for constant identifiers in code samples.

## Code Examples

- Follow the conventions of the language in the code block.
- For TypeScript/JavaScript:
  - `camelCase` for variables and functions.
  - `PascalCase` for classes, interfaces, and types.
  - `UPPER_SNAKE_CASE` for constants.
- For shell scripts:
  - `lowercase_snake_case` for variables.

## Metadata Keys

- Use **lowercase kebab-case** for metadata keys (`author-name`).
- See `metadata-conventions.md` for specific keys.
