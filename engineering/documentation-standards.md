# Documentation Standards

## Purpose

Documentation expectations for all code changes.

## Documentation Types

| Type          | Location              | Required           |
| ------------- | --------------------- | ------------------ |
| Code comments | In code               | Complex logic only |
| README        | Package root          | All packages       |
| Storybook     | `.stories.tsx`        | UI components      |
| API docs      | OpenAPI spec          | All endpoints      |
| ADR           | `specifications/adr/` | Major decisions    |

## Documentation Checklist

- [ ] README updated if package behavior changed.
- [ ] Storybook updated for new/changed components.
- [ ] OpenAPI spec updated for API changes.
- [ ] Architecture docs updated if domain changed.
- [ ] ADR created for significant decisions.

## References

- [Architecture Decision Records](architecture-decision-records.md): ADR process.
