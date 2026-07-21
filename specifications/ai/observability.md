# Observability

## Purpose

Monitoring and metrics for AI operations.

## Metrics

| Metric                    | Description                             |
| ------------------------- | --------------------------------------- |
| **Latency (P50/P95/P99)** | AI response time by model and feature   |
| **Token Usage**           | Input and output tokens per request     |
| **Cost**                  | Cost per request, per user, per feature |
| **Error Rate**            | Provider error rate                     |
| **Cache Hit Rate**        | Semantic cache effectiveness            |
| **Hallucination Rate**    | Sample-based evaluation                 |

## Logging

- All prompts and responses are logged.
- Metadata includes: userId, featureId, model, tokens used, latency.
- Prompts are truncated for storage but full versions are retained for audit.

## References

- [Cost Management](cost-management.md): Cost tracking.
- [Evaluation](evaluation.md): Quality metrics.
