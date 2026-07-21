# Business Capabilities

## Purpose

Map of business capabilities the platform provides.

## Capability Map

```mermaid
graph TB
    subgraph "Core Capabilities"
        ID[Identity Management]
        PP[Passport Management]
        CL[Claim Management]
        EV[Evidence Management]
        VF[Verification]
    end

    subgraph "AI Capabilities"
        RG[Resume Generation]
        SK[Skill Extraction]
        CR[Career Recommendations]
        CI[Career Insights]
    end

    subgraph "Ecosystem Capabilities"
        SE[Search]
        MP[Matching]
        MG[Messaging]
        ORG[Organization Management]
    end

    subgraph "Platform Capabilities"
        AUTH[Authentication]
        BILL[Billing]
        API[API Platform]
        AN[Analytics]
        NOT[Notifications]
    end

    ID --> PP
    PP --> CL
    CL --> EV
    EV --> VF
    PP --> RG
    RG --> SK
    SK --> CR
    CR --> CI
    VF --> SE
    SE --> MP
    MP --> MG
    ORG --> SE

    style ID fill:#e3f2fd
    style PP fill:#bbdefb
    style RG fill:#90caf9
    style SE fill:#64b5f6
    style AUTH fill:#42a5f5
```

## Capability Ownership

| Capability              | Product Area | Maturity |
| ----------------------- | ------------ | -------- |
| Identity Management     | Core         | MVP      |
| Passport Management     | Core         | MVP      |
| Verification            | Core         | MVP      |
| Resume Generation       | AI           | Growth   |
| Skill Extraction        | AI           | Growth   |
| Career Recommendations  | AI           | Future   |
| Candidate Search        | Recruiter    | Growth   |
| Organization Management | Enterprise   | Growth   |
| API Platform            | Platform     | Future   |

## References

- [Product Portfolio](product-portfolio.md): Product mapping.
