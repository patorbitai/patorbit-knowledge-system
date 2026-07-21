# Guardrails

## Purpose

Defines guardrail policies to control AI behavior.

## Guardrail Layers

```mermaid
graph TB
    subgraph "Input Guard"
        PII[PII Detection]
        INJ[Prompt Injection Detection]
        BLOCK[Blocked Topics]
    end

    subgraph "LLM"
        LLM[Model Processing]
    end

    subgraph "Output Guard"
        FILTER[Content Filter]
        FAKT[Factual Check]
        POLICY[Policy Check]
    end

    USER --> PII
    PII --> INJ
    INJ --> BLOCK
    BLOCK --> LLM
    LLM --> FILTER
    FILTER --> FAKT
    FAKT --> POLICY
    POLICY --> OUT[Safe Output]

    style PII fill:#ef5350
    style INJ fill:#ef5350
    style BLOCK fill:#ef5350
    style FILTER fill:#ffa726
    style FAKT fill:#ffa726
    style POLICY fill:#ffa726
```

## Guardrail Policies

| Policy           | Description                    | Action              |
| ---------------- | ------------------------------ | ------------------- |
| PII Detection    | Detect sensitive info in input | Mask before sending |
| Prompt Injection | Detect injection attempts      | Block request       |
| Blocked Topics   | Harmful or sensitive topics    | Block request       |
| Content Filter   | Unsafe output detection        | Mask or block       |
| Factual Check    | Unsupported claims             | Flag as unverified  |

## References

- [Safety](safety.md): Broader AI safety.
- [Privacy](privacy.md): Privacy controls.
