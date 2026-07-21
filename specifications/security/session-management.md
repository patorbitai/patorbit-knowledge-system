# Session Management

## Purpose

Secure session lifecycle management.

## Session Lifecycle

| Stage       | Control                                       |
| ----------- | --------------------------------------------- |
| Creation    | JWT issued on successful auth                 |
| Active      | Token validated on each request               |
| Refresh     | Refresh token rotated on each use             |
| Expiration  | Access token: 15 min; Refresh token: 30 days  |
| Revocation  | Force expire on password change, admin action |
| Termination | Clear session cookies on logout               |

## Concurrent Sessions

- Multiple sessions allowed per user (one per device).
- Users can view and revoke active sessions from settings.

## References

- [Authentication Security](authentication-security.md): Auth flow.
