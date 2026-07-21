# Architecture Decision Records

## Purpose

Index of key AI architecture decisions.

## ADR Index

| #   | Title                                     | Status   | Date       |
| --- | ----------------------------------------- | -------- | ---------- |
| 001 | Use Claude API as Primary LLM Provider    | Accepted | 2026-07-21 |
| 002 | Implement Provider Abstraction Layer      | Accepted | 2026-07-21 |
| 003 | Use Semantic Caching for Cost Reduction   | Accepted | 2026-07-21 |
| 004 | Use pgvector for Embedding Storage        | Accepted | 2026-07-21 |
| 005 | Implement RAG with Multi-Source Retrieval | Accepted | 2026-07-21 |
| 006 | Use LLM-as-Judge for Evaluation           | Accepted | 2026-07-21 |
| 007 | Adopt Agent-Based Architecture            | Accepted | 2026-07-21 |
| 008 | Prompt Templates Stored in Database       | Accepted | 2026-07-21 |
| 009 | Temperature Softened for Creative Tasks   | Accepted | 2026-07-21 |

## ADR Template

```markdown
# [Number]. [Title]

- **Status**: [Proposed | Accepted | Deprecated]
- **Date**: [YYYY-MM-DD]

## Context

[What is the decision being made?]

## Decision Drivers

- [Driver 1]
- [Driver 2]

## Options Considered

1. [Option 1]
2. [Option 2]

## Decision

[Chosen option and rationale]

## Consequences

- Positive: [...]
- Negative: [...]

## References

- [Related documents]
```

## References

- [System ADRs](../architecture/architecture-decision-records.md): System-level ADRs.
