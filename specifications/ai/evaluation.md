# Evaluation

## Purpose

Defines the AI evaluation pipeline to ensure quality and prevent regressions.

## Evaluation Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant CI as CI/CD
    participant EVAL as Evaluation Service
    participant LLMJ as LLM-as-Judge
    participant HR as Human Review

    Dev->>CI: Commit prompt change
    CI->>EVAL: Run prompt tests
    EVAL->>EVAL: Run against golden dataset
    EVAL->>LLMJ: Score outputs
    LLMJ-->>EVAL: Scores
    EVAL->>EVAL: Compare with baseline
    alt Regression Detected
        EVAL-->>CI: Fail build
        CI-->>Dev: Alert developer
    else No Regression
        EVAL-->>HR: Sample for human review
        EVAL-->>CI: Pass build
    end
```

## Metrics

| Metric                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| **Accuracy**           | Correctness of extracted information          |
| **Completeness**       | How much relevant information was captured    |
| **Relevance**          | How relevant the output is to the task        |
| **Coherence**          | Readability and fluency                       |
| **Safety**             | Absence of harmful content                    |
| **Hallucination Rate** | Percentage of outputs with unsupported claims |

## References

- [AI Testing](ai-testing.md): Testing strategy.
- [Human-in-the-Loop](human-in-the-loop.md): Human review.
