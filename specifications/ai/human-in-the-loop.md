# Human-in-the-Loop

## Purpose

Defines human review workflows for AI-generated content that requires verification.

## Review Workflows

| Workflow          | Trigger                            | Reviewer                | Escalation |
| ----------------- | ---------------------------------- | ----------------------- | ---------- |
| Claim Generation  | AI suggests a new claim            | User                    | —          |
| Resume Generation | AI generates a resume section      | User                    | —          |
| Evidence Analysis | AI flags a potential anomaly       | Verification Specialist | Supervisor |
| Verification      | AI cannot determine claim validity | Human Verifier          | Supervisor |
| Content Flag      | Output guardrail triggered         | Safety Team             | —          |

## Feedback Loop

- Review results are fed back into the evaluation pipeline.
- Flagged outputs help improve prompts and detection.
- User corrections are stored for future model training.

## References

- [AI Testing](ai-testing.md): Testing AI with human feedback.
