# AI Security

## Purpose

Security controls specific to AI-powered features.

## Threat Model (AI-Specific)

| Threat                   | Description                                 | Mitigation                                  |
| ------------------------ | ------------------------------------------- | ------------------------------------------- |
| Prompt Injection         | Malicious input hijacks model behavior      | Input guardrails, prompt sandboxing         |
| Data Leakage             | Sensitive data exposed in model outputs     | PII masking, output filtering               |
| Model Abuse              | Using AI for prohibited purposes            | Usage policies, content moderation          |
| Training Data Extraction | Extracting training data from model outputs | Zero-retention config, differential privacy |
| Tool Abuse               | AI calling tools without authorization      | Tool-level access controls, human approval  |
| Retrieval Poisoning      | Malicious documents in retrieval store      | Document scanning, content moderation       |
| Hallucination Harm       | Model generates false career info           | Evidence grounding, confidence thresholds   |

## Controls

| Control            | Implementation                                            |
| ------------------ | --------------------------------------------------------- |
| Input Sanitization | Strip injection vectors before prompt assembly            |
| Output Validation  | Verify outputs against expected schema and content policy |
| Rate Limiting      | Per-user AI request limits                                |
| Audit Trail        | Full prompt and response logging                          |
| Human Review       | Escalation for high-stakes decisions                      |
| PII Masking        | Detect and mask PII before sending to providers           |

## References

- [Guardrails](../ai/guardrails.md): AI guardrails.
- [Safety](../ai/safety.md): AI safety framework.
