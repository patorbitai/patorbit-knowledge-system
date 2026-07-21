# Customer Journeys

## Purpose

End-to-end user journeys for key personas.

## Journey: Individual Professional

```mermaid
graph LR
    A[Register] --> B[Complete Profile]
    B --> C[Add Claims]
    C --> D[Attach Evidence]
    D --> E[Request Verification]
    E --> F[Publish Passport]
    F --> G[Generate Resume]
    G --> H[Apply for Jobs]

    style A fill:#e3f2fd
    style C fill:#bbdefb
    style E fill:#90caf9
    style F fill:#64b5f6
    style G fill:#42a5f5
```

## Journey: Recruiter

```mermaid
graph LR
    A[Register Org] --> B[Setup Workspace]
    B --> C[Search Candidates]
    C --> D[Review Verified Claims]
    D --> E[Shortlist]
    E --> F[Contact Candidate]

    style A fill:#e3f2fd
    style C fill:#90caf9
    style F fill:#64b5f6
```

## References

- [Jobs to Be Done](jobs-to-be-done.md): Needs analysis.
