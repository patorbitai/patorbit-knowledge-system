# API Development

## Purpose

API implementation workflow following API-First principles.

## Workflow

1. **Design**: Define the API in OpenAPI spec.
2. **Review**: API reviewed by team.
3. **Generate**: Generate server stubs from spec.
4. **Implement**: Implement business logic.
5. **Test**: Write contract and integration tests.
6. **Document**: Update API documentation.

## Standards

- All new endpoints require an OpenAPI spec before implementation.
- Specs are stored in `specifications/api/`.
- Breaking changes require version bump.

## References

- [API Architecture](../specifications/api/README.md): API design.
