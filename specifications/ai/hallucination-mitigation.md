# Hallucination Mitigation

## Purpose

Defines strategies to minimize AI hallucinations (unsupported claims).

## Strategies

| Strategy                | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| **Grounding**           | All outputs must cite sources from retrieved context.   |
| **Confidence Scoring**  | Output a confidence score for each generated statement. |
| **Output Validation**   | Cross-reference generated claims with Knowledge Graph.  |
| **Fact-Checking**       | For external claims, run a web search to verify facts.  |
| **User Feedback**       | Allow users to flag incorrect outputs.                  |
| **Temperature Control** | Use low temperature (0-0.2) for factual generation.     |

## References

- [RAG Architecture](rag-architecture.md): Context retrieval.
- [Evaluation](evaluation.md): Measuring hallucination rate.
