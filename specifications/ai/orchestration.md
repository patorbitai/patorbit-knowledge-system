# Orchestration

## Purpose

This document defines the AI orchestration engine for the Patorbit platform, enabling complex multi-step AI workflows.

## Scope

Workflow execution, multi-step reasoning, retries, timeouts, and state handling.

---

## Orchestration Architecture

```mermaid
graph TB
    subgraph "Orchestrator"
        WF[Workflow Engine]
        STATE[State Manager]
        MEM[Memory Manager]
        RETRY[Retry Handler]
    end

    subgraph "Workflow Steps"
        S1[Step 1: Analyze]
        S2[Step 2: Retrieve]
        S3[Step 3: Generate]
        S4[Step 4: Validate]
    end

    subgraph "Execution"
        LLM[LLM Call]
        TOOL[Tool Call]
        WAIT[Human Wait]
    end

    WF --> S1
    S1 --> S2
    S2 --> S3
    S3 --> S4
    S1 --> LLM
    S2 --> TOOL
    S4 --> WAIT
    WF --> STATE
    WF --> MEM
    WF --> RETRY

    style WF fill:#90caf9
    style STATE fill:#64b5f6
    style MEM fill:#42a5f5
    style RETRY fill:#ffa726
    style S1 fill:#e3f2fd
    style S2 fill:#e3f2fd
    style S3 fill:#e3f2fd
    style S4 fill:#e3f2fd
```

---

## Workflow Definition

Workflows are defined as a sequence of steps:

```yaml
workflow: generate_resume
steps:
  - id: analyze_passport
    type: llm
    prompt: resume/generate/summary
  - id: retrieve_skills
    type: tool
    tool: get_claims
    depends_on: analyze_passport
  - id: generate_section
    type: llm
    prompt: resume/generate/experience
    depends_on: [analyze_passport, retrieve_skills]
  - id: validate_output
    type: tool
    tool: validate_resume
    depends_on: generate_section
```

## State Handling

- Workflow state is persisted between steps.
- If a step fails, the workflow can be retried from the failed step (not from the beginning).
- State is scoped to the session.

## Retry Strategy

| Failure Type      | Retries | Strategy                  |
| ----------------- | ------- | ------------------------- |
| LLM Timeout       | 3       | Exponential backoff       |
| Tool Failure      | 2       | Immediate retry           |
| Validation Failed | 1       | Re-generate with feedback |
| Human Timeout     | —       | Keep waiting              |

## References

- [Agent Architecture](agent-architecture.md): Agents orchestrated by this engine.
- [Tool Calling](tool-calling.md): Tools executed during workflows.
- [AI Platform Overview](ai-platform-overview.md): System integration.
