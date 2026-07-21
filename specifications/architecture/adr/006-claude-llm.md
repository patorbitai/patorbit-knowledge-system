# 006. Use Claude API as Primary LLM Provider

- **Status**: Accepted
- **Date**: 2026-07-21
- **Author**: Platform Team

## Context

The Patorbit platform requires an LLM provider for resume analysis, skill extraction, and claim optimization. The provider must excel at understanding resume structures.

## Decision Drivers

- Resume understanding quality
- Structured output support
- Safety and content filtering

## Considered Options

1. **Claude API** (Anthropic): Superior resume understanding and structured outputs.
2. **OpenAI API**: Strong ecosystem, but lower accuracy for factual analysis.
3. **Self-hosted models** (Llama, Mistral): Lower cost, but lower quality.

## Decision Outcome

**Chosen option**: **Claude API**, for its superior accuracy in analyzing professional contexts and powerful tool-use support.

## References

- [AI Architecture](../ai-architecture.md)
