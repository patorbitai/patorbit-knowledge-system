# Agent Architecture

## Purpose

This document defines the AI agent architecture for the Patorbit platform, enabling specialized agents for different tasks.

## Scope

This document covers agent definitions, responsibilities, and the agent lifecycle.

---

## Agent Architecture

```mermaid
graph TB
    subgraph "Agent Platform"
        ORCH[Orchestrator]
        REG[Agent Registry]
    end

    subgraph "Specialized Agents"
        RES_A[Resume Agent]
        CAREER_A[Career Coach Agent]
        REC_A[Recruiter Assistant]
        ORG_A[Organization Assistant]
        KNOW_A[Knowledge Curator]
        VER_A[Verification Assistant]
    end

    subgraph "Shared Tools"
        SEARCH[Search Tool]
        KG[Knowledge Graph Tool]
        RESUME[Resume Builder Tool]
        NOTIFY[Notification Tool]
    end

    ORCH --> REG
    REG --> RES_A
    REG --> CAREER_A
    REG --> REC_A
    REG --> ORG_A
    REG --> KNOW_A
    REG --> VER_A
    RES_A --> SEARCH
    RES_A --> KG
    RES_A --> RESUME
    REC_A --> SEARCH
    REC_A --> NOTIFY

    style ORCH fill:#90caf9
    style REG fill:#64b5f6
    style RES_A fill:#ce93d8
    style CAREER_A fill:#ce93d8
    style REC_A fill:#ce93d8
    style ORG_A fill:#ce93d8
    style KNOW_A fill:#ce93d8
    style VER_A fill:#ce93d8
    style SEARCH fill:#42a5f5
    style KG fill:#42a5f5
    style RESUME fill:#42a5f5
    style NOTIFY fill:#42a5f5
```

---

## Agent Definitions

### Resume Agent

**Purpose**: Assist users in creating, optimizing, and customizing resumes.

**Capabilities**:

- Generate professional summaries.
- Optimize experience descriptions.
- Extract and format skills.
- Tailor content for target roles.
- ATS compatibility analysis.

### Career Coach Agent

**Purpose**: Provide personalized career advice and recommendations.

**Capabilities**:

- Career path recommendations.
- Skill gap analysis.
- Industry trend insights.
- Learning resource suggestions.
- Interview preparation.

### Recruiter Assistant

**Purpose**: Help recruiters find and evaluate candidates.

**Capabilities**:

- Natural language candidate search.
- Candidate profile summaries.
- Match scoring with explanations.
- Search query optimization.
- Outreach message generation.

### Organization Assistant

**Purpose**: Help organizations manage their talent data.

**Capabilities**:

- Workforce analytics.
- Skill gap analysis.
- Verification queue assistance.
- Credential issuance support.
- Talent pool analysis.

### Knowledge Curator

**Purpose**: Maintain and enrich the Knowledge Graph.

**Capabilities**:

- Entity linking.
- Relationship discovery.
- Duplicate detection.
- Taxonomy management.
- Data quality improvement.

### Verification Assistant

**Purpose**: Assist the verification process.

**Capabilities**:

- Evidence document analysis.
- Consistency checking.
- Flag potential fraud.
- Verification confidence scoring.

## Agent Lifecycle

1. **Instantiated**: A new agent is created for a session.
2. **Configured**: The agent receives a system prompt and available tools.
3. **Active**: The agent processes requests.
4. **Terminated**: The session ends, and the agent is released.

## References

- [Tool Calling](tool-calling.md): Tools available to agents.
- [Orchestration](orchestration.md): Orchestrating agent workflows.
- [AI Platform Overview](ai-platform-overview.md): Overall architecture.
