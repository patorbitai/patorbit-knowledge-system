# Platform Ecosystem

## Purpose

Ecosystem design and platform participants.

## Participants

| Participant   | Role                         | Value                   |
| ------------- | ---------------------------- | ----------------------- |
| Professionals | Create and share career data | Career opportunities    |
| Recruiters    | Find and evaluate talent     | Verified candidate data |
| Organizations | Verify employees             | Talent intelligence     |
| Verifiers     | Verify evidence              | Verification fees       |
| Developers    | Build on the platform        | Access to career data   |
| Partners      | Integrate services           | Platform access         |

## Ecosystem Flywheel

```mermaid
graph TB
    P[Professionals] --> CP[Career Passports]
    CP --> V[Verification]
    V --> TR[Trusted Data]
    TR --> R[Recruiters]
    R --> O[Organizations]
    O --> V

    style P fill:#e3f2fd
    style CP fill:#bbdefb
    style V fill:#90caf9
    style TR fill:#64b5f6
    style R fill:#42a5f5
    style O fill:#2196f3
```

## References

- [Partnerships](partnerships.md): Partner model.
