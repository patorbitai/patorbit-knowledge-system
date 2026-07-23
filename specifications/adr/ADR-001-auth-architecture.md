# ADR-001: Authentication Architecture

## Status: Accepted

## Context

The Patorbit Knowledge System requires robust authentication and authorization to protect user accounts, organization data, and API endpoints. The authentication system must support:

- Secure user authentication with multiple password hashing algorithms
- Session management with JWT tokens and refresh token rotation
- Multi-factor authentication support
- Account lockout mechanisms to prevent brute-force attacks
- Cross-Origin Resource Sharing (CORS) protection

## Decision

We will implement JWT-based authentication with access and refresh tokens, session management via refresh token rotation, CSRF protection using the double-submit cookie pattern, password hashing with bcrypt (12 rounds), and account lockout after 5 failed attempts.

### JWT-based Authentication

**Access Tokens:** Short-lived (15 minutes) JWT tokens containing:

- User ID (`sub`)
- Email (`email`)
- Role (`role`)
- Token type (`type`)

**Refresh Tokens:** Long-lived (7-90 days) JWT tokens used to obtain new access tokens without requiring user credentials.

### Session Management

Implement refresh token rotation where:

- Each refresh token exchange generates a new refresh token
- Old refresh tokens are immediately invalidated
- Session tracking in database for revocation and cleanup
- Remember-me option for extended sessions (90 days)

### CSRF Protection

Use double-submit cookie pattern:

- CSRF token stored in HTTP-only cookie
- Same token exposed via custom header (`X-CSRF-Token`)
- State-changing operations (POST, PUT, DELETE, PATCH) require both tokens to match
- Different cookie names for production (`__Host-csrf-token`) vs development

### Password Security

**Hashing:** bcrypt with 12 rounds

- Salt generated per password
- Strong resistance to brute-force and rainbow table attacks
- Automatic password strength validation

**Account Lockout:**

- Maximum 5 failed login attempts
- Lockout duration: 15 minutes per `LOCKOUT_DURATION_MINUTES`
- Automatic unlock after timeout
- Brute-force email enumeration prevention (always return same response)

## Implementation Details

### Token Services

```typescript
// Token generation and validation
@Injectable()
export class TokenService {
  // Generate access and refresh tokens
  // Verify refresh tokens with rotation
  // Handle token expiration and invalidation
}
```

### Session Management

```typescript
// Session tracking and rotation
@Injectable()
export class SessionService {
  // Create new sessions with refresh tokens
  // Validate and rotate refresh tokens
  // Revoke sessions on logout or password change
  // Track session metadata (device, IP, etc.)
}
```

### Rate Limiting and Lockout

```typescript
// Account lockout mechanism
@Injectable()
export class IdentityService {
  // Check account lockout status
  // Implement lockout after threshold exceeded
  // Reset lockout on successful login
}
```

## Security Considerations

1. **Token Storage:** Refresh tokens stored in HTTP-only cookies
2. **Token Transport:** Access tokens in Authorization header (Bearer token)
3. **Token Rotation:** Always issue new refresh tokens
4. **Password Storage:** Never store plain text or weak hashes
5. **Session Cleanup:** Regular cleanup of expired sessions
6. **Audit Logging:** Log all authentication events

## Migration Path

- Existing basic authentication will be replaced
- Backward compatibility maintained for API consumers
- Graceful transition period for users
- Comprehensive testing of new authentication flows

## Related Documents

- ADR-002: Multi-tenant Architecture (references user management)
- deployment-guide.md (token storage configuration)
- recovery-guide.md (account recovery procedures)

## Decision Rationale

This architecture provides:

1. **Security:** Industry-standard JWT, bcrypt, and CSRF protection
2. **Scalability:** Token-based authentication scales horizontally
3. **User Experience:** Refresh token rotation eliminates password re-entry
4. **Compliance:** Meets modern authentication standards and regulations
5. **Maintainability:** Clear separation of concerns and well-defined interfaces

## Future Considerations

- Integrate with SSO providers (Google, Microsoft, etc.)
- Add WebAuthn support for passwordless authentication
- Implement adaptive authentication based on risk
- Add multi-factor authentication options
- Consider token blacklisting for immediate invalidation

## References

1. OWASP Authentication Cheat Sheet
2. RFC 7519 (JWT Specification)
3. OAuth 2.0 Token Rotation (RFC 7008)
4. OWASP CSRF Prevention Cheat Sheet
5. OWASP Password Storage Cheat Sheet
