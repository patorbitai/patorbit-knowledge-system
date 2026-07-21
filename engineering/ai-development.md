# AI Development

## Purpose

Workflow for AI feature development.

## Workflow

1. **Design**: Define prompt template, context sources, output schema.
2. **Prototype**: Test prompt in AI playground.
3. **Golden Dataset**: Create evaluation dataset.
4. **Implement**: Integrate prompt into AI orchestrator.
5. **Evaluate**: Run against golden dataset.
6. **Review**: Human review of outputs.
7. **Release**: Canary rollout with monitoring.

## Standards

- All prompts are versioned.
- Every prompt has an evaluation dataset.
- Hallucination rate is tracked.
- A/B testing for prompt changes.

## References

- [AI Architecture](../specifications/ai/README.md): AI design.
