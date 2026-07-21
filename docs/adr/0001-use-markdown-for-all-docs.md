# 1. Use Markdown for All Documentation

- **Status**: Proposed
- **Date**: 2026-07-21

## Context and Problem Statement

The Patorbit Knowledge System (PKS) requires a simple, sustainable, and future-proof format for all textual documentation. The format needs to be plain-text to work well with version control systems like Git, easy for both technical and non-technical contributors to write, and convertible to other formats like HTML and PDF. Proprietary formats like Microsoft Word or complex formats like LaTeX introduce high friction and vendor lock-in.

## Decision Drivers

- **Version Control Friendliness**: The format must produce clean diffs in Git.
- **Ease of Use**: Low barrier to entry for contributors.
- **Ecosystem Support**: A wide range of tools for linting, rendering, and processing.
- **Portability**: Must be easy to convert to other formats.
- **Future-Proof**: The format should be based on an open standard that is likely to exist for a long time.

## Considered Options

1.  **Markdown (with GitHub Flavored Markdown extensions)**: A lightweight markup language with a plain-text-formatting syntax.
2.  **AsciiDoc**: A more powerful, feature-rich markup language, often considered "Markdown for technical documentation."
3.  **reStructuredText (rST)**: The official documentation language of the Python project, powerful but with a steeper learning curve.
4.  **XML/HTML**: Verbose and not ideal for human authoring.

## Decision Outcome

Chosen option: **Markdown**, because it best satisfies the decision drivers.

- **Simplicity and Ubiquity**: Markdown is the de facto standard for documentation on platforms like GitHub. Most technical professionals are already familiar with it.
- **Tooling**: The ecosystem around Markdown is vast, with excellent support in editors (VS Code), static site generators (MkDocs, Hugo), and linters (markdownlint).
- **Readability**: Raw Markdown files are highly readable, which is a key tenet of the documentation-as-code philosophy.
- **Extensibility**: While core Markdown is limited, extensions (like those in MkDocs Material) provide necessary features like admonitions, footnotes, and tables.

We will standardize on GitHub Flavored Markdown (GFM) as a base and leverage the extensions provided by MkDocs Material.

### Consequences

- **Positive**:
  - Low friction for new contributors.
  - Excellent integration with our chosen tooling (GitHub, VS Code, MkDocs).
  - Clean, human-readable version history.
- **Negative**:
  - Less powerful than AsciiDoc for complex documentation needs (e.g., complex tables, cross-references). We can mitigate this with MkDocs plugins as needed.
  - Lack of a formal specification can lead to flavor fragmentation, but we will standardize on GFM and MkDocs Material's parser.
