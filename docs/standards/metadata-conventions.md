# Metadata Conventions

This document defines the conventions for metadata within the Patorbit Knowledge System (PKS). All documents may contain a YAML frontmatter block for metadata.

## Standard Schema

The following metadata keys form the basis of our schema. While not all keys are required for every document, using them consistently is crucial for discoverability and automation.

```yaml
---
title: 'Document Title'
uid: 'unique-identifier-for-document'
status: 'draft' # draft | in-review | stable | deprecated
creationDate: 'YYYY-MM-DD'
lastModified: 'YYYY-MM-DD'
version: '1.0.0'
authors:
  - 'Author Name'
tags:
  - 'tag1'
  - 'tag2'
---
```

## Key Descriptions

- **`title`**: (Required) The official title of the document.
- **`uid`**: (Optional but Recommended) A unique identifier for the document that is stable across renames. A UUID or a descriptive kebab-case string is recommended.
- **`status`**: (Required) The current status of the document's content.
  - `draft`: The document is a work in progress.
  - `in-review`: The document is complete but awaiting review and approval.
  - `stable`: The document is considered complete and reliable.
  - `deprecated`: The document is outdated and should not be used.
- **`creationDate`**: (Optional) The date the document was created.
- **`lastModified`**: (Optional) The date the document was last significantly updated.
- **`version`**: (Optional) The semantic version of the document, if applicable (e.g., for specifications).
- **`authors`**: (Optional) A list of primary authors or owners of the document.
- **`tags`**: (Optional) A list of keywords or tags for filtering and discovery.

This schema will be expanded as the PKS evolves.
