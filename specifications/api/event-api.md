# Event API

## Purpose

This document defines the event contracts for asynchronous integrations with the Patorbit platform, enabling consumers to build event-driven applications.

## Scope

This document covers event types, schema structure, and delivery guarantees.

---

## Event Types

| Event Type                 | Version | Description                               |
| -------------------------- | ------- | ----------------------------------------- |
| `passport.published`       | 1       | Passport published and discoverable       |
| `passport.version.created` | 1       | New passport version created              |
| `claim.created`            | 1       | New claim created                         |
| `claim.verified`           | 1       | Claim moved to verified status            |
| `evidence.submitted`       | 1       | New evidence submitted                    |
| `verification.completed`   | 1       | Verification completed (any verdict)      |
| `organization.verified`    | 1       | Organization verified                     |
| `subscription.activated`   | 1       | Subscription activated                    |
| `identity.verified`        | 1       | Identity reached a new verification level |

---

## Event Envelope

```json
{
  "specversion": "1.0",
  "id": "evt_abc123",
  "source": "/v1/passports/pass_123",
  "type": "passport.published",
  "datacontenttype": "application/json",
  "time": "2026-07-21T14:30:00Z",
  "data": {
    "passportId": "pass_123",
    "identityId": "user_abc",
    "version": "2.0.0",
    "visibility": "public"
  },
  "data_schema": "https://api.patorbit.com/schemas/events/passport.published.v1.json"
}
```

## Delivery Guarantees

- **At-least-once**: Events may be delivered more than once.
- **Ordering**: Events within a partition are ordered (by `source`).
- **Retention**: Events are available for replay for 7 days.

## References

- [Webhooks](webhooks.md): Webhook delivery mechanism.
- [Messaging](../architecture/messaging.md): Internal event bus.
- [Domain Events](../domain/domain-events.md): Domain event specifications.
