# Authorization Security

## Purpose

Authorization controls and policy enforcement mechanisms.

## Model

**Hybrid RBAC + ABAC**: Roles for broad access, attributes for fine-grained control.

## Policy Enforcement

1. Gateway validates JWT and extracts user claims.
2. RBAC guard checks role requirements.
3. ABAC policy engine evaluates resource-level rules.
4. Database query includes ownership filters.

## Key Controls

| Control         | Implementation                                           |
| --------------- | -------------------------------------------------------- |
| Role-Based      | Pre-defined roles with permission sets                   |
| Attribute-Based | Policies based on user, resource, environment attributes |
| Ownership       | Users own their data; org admins own org data            |
| Delegation      | Scoped tokens for delegated access                       |
| Deny by Default | No access unless explicitly granted                      |

## References

- [Authentication Security](authentication-security.md): Auth mechanisms.
- [Session Management](session-management.md): Session context.
