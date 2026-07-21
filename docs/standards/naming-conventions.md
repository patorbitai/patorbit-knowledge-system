# Naming Conventions

This document outlines the standard naming conventions to be used across the Patorbit Knowledge System (PKS). Consistency in naming is crucial for clarity, discoverability, and maintainability.

## General Principles

- **Use kebab-case for filenames and directory names.** This is URL-friendly and common in web development.
  - _Example_: `naming-conventions.md`, `book-1-foundation/`
- **Use PascalCase for titles and major headings.**
  - _Example_: `# Book I: Foundation`
- **Use snake_case for code variables or identifiers where appropriate**, especially if a target language's convention dictates it. For general-purpose identifiers in documentation, prefer `camelCase`.

## Directory Structure

- Top-level directories should represent a clear, singular category of knowledge.
- Subdirectories should follow a logical hierarchy.

## File Naming

- Use clear, descriptive names for files. Avoid abbreviations.
- Index files within a directory should be named `index.md`. This is the standard for MkDocs and many other static site generators.
- ADR files should be prefixed with their number, e.g., `0001-use-markdown-for-all-docs.md`.

## Branch Naming

- Follow the convention `[type]/[short-description]`.
- _Example_: `feat/add-api-spec`, `docs/clarify-versioning`

## Metadata Keys

- All metadata keys should be `camelCase`.
- _Example_: `creationDate`, `lastModified`
