# How to Contribute to the Patorbit Knowledge System

We welcome and appreciate contributions to the Patorbit Knowledge System (PKS). This document outlines the standards and procedures for contributing to ensure the quality, consistency, and integrity of our knowledge base.

## Repository Workflow

The PKS follows a standard GitHub flow. All work is done on feature branches and integrated into the `main` branch via pull requests.

### Branch Strategy

- **`main`**: The primary branch representing the current, approved state of the knowledge system. Direct pushes to `main` are prohibited.
- **Feature Branches**: All new work, including documentation, fixes, and updates, must be done on a feature branch.
- **Branch Naming Convention**: Branches should be named descriptively using the convention:
  `[type]/[short-description]`
  - `[type]`: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`
  - Example: `feat/add-api-specification` or `docs/clarify-glossary-term`

### Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This provides a clear and descriptive commit history. Each commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

- **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `revert`.
- **scope**: An optional noun describing the section of the knowledge base being changed (e.g., `specifications`, `book-1`, `adr`).
- **description**: A concise summary of the change in the imperative mood (e.g., "Add," "Fix," "Change").

**Example:**
`docs(adr): add template for architecture decision records`

### Pull Request (PR) Process

1.  **Create a PR**: Once your work is complete on a feature branch, open a pull request against the `main` branch.
2.  **Fill out the Template**: Complete the pull request template, providing a clear description of the changes and linking to any relevant issues.
3.  **Automated Checks**: The PR will trigger automated checks, including Markdown linting and a successful MkDocs build. These checks must pass before the PR can be merged.
4.  **Review**: At least one review from a core maintainer is required for a PR to be merged. The review will focus on accuracy, clarity, adherence to standards, and overall quality.
5.  **Merge**: Once approved and all checks have passed, the PR will be squashed and merged into `main`.

## Documentation Standards

All contributions must adhere to the standards defined in the `standards/` directory. Key standards include:

- [Documentation Conventions](standards/documentation-conventions.md)
- [Markdown Conventions](standards/markdown-conventions.md)
- [Naming Conventions](standards/naming-conventions.md)
- [Metadata Conventions](standards/metadata-conventions.md)

## Issue Reporting

If you find a bug, an error, or have a suggestion for improvement, please open an issue using the appropriate template:

- **Bug Report**: For errors, typos, or inaccuracies.
- **Feature Request**: For proposing new content or structural changes.
- **Documentation Improvement**: For suggesting clarifications or enhancements to existing content.
- **Question**: For asking questions about the PKS.

Thank you for helping us build a world-class knowledge system.
