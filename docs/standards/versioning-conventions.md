# Versioning Conventions

This document outlines the versioning strategy for the Patorbit Knowledge System (PKS) and its constituent parts.

## Repository Versioning

The PKS repository as a whole adheres to [Semantic Versioning 2.0.0](https://semver.org/). The version is tracked in the `CHANGELOG.md` file.

- **MAJOR (`X.y.z`)**: Incremented for major, incompatible changes to the knowledge architecture or core principles. This would signify a fundamental shift in how the PKS is structured or governed.
- **MINOR (`x.Y.z`)**: Incremented when new knowledge, sections, books, or specifications are added in a backward-compatible manner. Most significant additions will be MINOR version bumps.
- **PATCH (`x.y.Z`)**: Incremented for backward-compatible fixes, such as correcting typos, clarifying existing documentation, or fixing broken links.

The current version is `0.1.0`.

## Document and Artifact Versioning

Individual documents, particularly formal specifications or ADRs, may have their own version independent of the repository version.

- **Specifications**: Must include a `version` key in their metadata frontmatter.
- **ADRs**: Are immutable once they are `accepted`. They should not be versioned, but superseded by a new ADR if necessary.
- **Books**: A published book corresponds to a specific Git tag/release of the PKS repository. The book itself will be versioned (e.g., First Edition, Second Edition) corresponding to these major releases.

This dual-level versioning allows the repository to evolve rapidly while providing stability for critical, version-sensitive artifacts.
