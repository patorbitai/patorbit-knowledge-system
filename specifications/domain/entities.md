# Entities

## Purpose

This document defines every major entity within the Patorbit domain model. Each entity has a unique identity that persists across state changes and time. Entities are the backbone of the domain — they carry identity, lifecycle, and business rules.

## Scope

This document covers all core entities across every bounded context. For each entity, we specify its purpose, key attributes, lifecycle, relationships, and business rules.

---

## 1. Identity

**Context**: Identity

**Purpose**: The Identity entity represents a person within the Patorbit platform. It is the root of all user activity and the anchor for Claims, Passport, and Trust. An Identity is established at registration and strengthened through verification over time.

**Key Attributes**:

| Attribute           | Type                                 | Description                                      |
| ------------------- | ------------------------------------ | ------------------------------------------------ |
| `identityId`        | IdentityId (UUID)                    | Globally unique identifier                       |
| `email`             | Email (value object)                 | Primary email address, verified                  |
| `phone`             | PhoneNumber (value object, optional) | Verified phone number                            |
| `status`            | IdentityStatus                       | `pending`, `active`, `suspended`, `deactivated`  |
| `verificationLevel` | VerificationLevel                    | `unverified`, `email_verified`, `fully_verified` |
| `createdAt`         | Timestamp                            | When the identity was registered                 |
| `lastActiveAt`      | Timestamp                            | Last authentication timestamp                    |
| `preferences`       | ProfilePreferences                   | User-configurable preferences                    |

**Lifecycle**:

1. **Created**: User registers via email/password or OAuth provider. Status is `pending`.
2. **Activated**: Email is verified. Status becomes `active`.
3. **Enhanced**: Additional verification methods are added (phone, government ID). Verification level increases.
4. **Suspended**: Platform administrator or automated detection suspends the identity.
5. **Deactivated**: User initiates account deactivation. Data is preserved but identity is inaccessible.

**Relationships**:

- Has exactly one Profile (1:1)
- Owns exactly one CareerPassport (1:1)
- Submits zero or more Claims (1:N)
- Is member of zero or more Organizations (N:N through OrganizationMember)
- Has zero or more AuthenticationMethods (1:N)

**Business Rules**:

- An Identity must have a verified email address before it can publish a Career Passport.
- An Identity can be linked to exactly one Identity per authentication provider.
- An Identity cannot be deleted if it has active published Passports; it can only be deactivated.
- Deactivation preserves all data but invalidates all sessions and tokens.
- An Identity may hold multiple roles simultaneously (e.g., individual + recruiter + verifier).

---

## 2. Profile

**Context**: Identity

**Purpose**: The Profile is the public face of an Identity. It contains curated, presentation-oriented information derived from verified Claims.

**Key Attributes**:

| Attribute       | Type              | Description                            |
| --------------- | ----------------- | -------------------------------------- |
| `profileId`     | ProfileId (UUID)  | Globally unique identifier             |
| `identityId`    | IdentityId        | Owning identity                        |
| `displayName`   | string            | Public display name                    |
| `headline`      | string (optional) | Professional headline                  |
| `photoUrl`      | URL (optional)    | Profile photo                          |
| `visibility`    | ProfileVisibility | `public`, `recruiters_only`, `private` |
| `lastUpdatedAt` | Timestamp         | When profile was last modified         |

**Lifecycle**:

1. **Created**: Auto-created with Identity registration.
2. **Updated**: User modifies profile information.
3. **Visibility Changed**: User changes sharing preferences.

**Relationships**:

- Belongs to exactly one Identity (1:1)
- References Claims for headline and summary content (derived)

**Business Rules**:

- Profile display name must not be empty.
- Profile may only display Claims that are `verified` or have Confidence Score > 0.7.
- Profile photo must pass moderation checks.

---

## 3. CareerPassport

**Context**: Career Passport

**Purpose**: The Career Passport is the canonical, living document that aggregates an individual's complete professional history. It is built on Claims, not free text, and serves as the authoritative source for all derived artifacts (Resumes, exports, shares).

**Key Attributes**:

| Attribute          | Type                     | Description                      |
| ------------------ | ------------------------ | -------------------------------- |
| `passportId`       | PassportId (UUID)        | Globally unique identifier       |
| `identityId`       | IdentityId               | Owning identity                  |
| `status`           | PassportStatus           | `draft`, `published`, `archived` |
| `currentVersion`   | VersionNumber            | Latest version number            |
| `publishedVersion` | VersionNumber (optional) | Last published version           |
| `createdAt`        | Timestamp                | Creation timestamp               |
| `lastModifiedAt`   | Timestamp                | Last modification timestamp      |

**Lifecycle**:

1. **Created**: Auto-created with Identity registration. Status is `draft`.
2. **Populated**: Claims are added as the identity creates or imports professional history.
3. **Published**: A version is frozen and shared. Status becomes `published`.
4. **Updated**: New claims, evidence, or verifications are added. Version number increments.
5. **Archived**: User archives the passport. It becomes read-only.

**Relationships**:

- Belongs to exactly one Identity (1:1)
- Contains zero or more Claims (1:N)
- Has zero or more PassportVersions (1:N)
- Has zero or more Publications (1:N)
- Is source for zero or more Resumes (1:N)

**Business Rules**:

- A Passport must contain at least one Claim before it can be published.
- Published Passport versions are immutable. Changes create a new version.
- A Passport version can be published only if all included Claims have at least one Evidence node.
- The Passport status must be `published` for it to be discoverable by Recruiters.
- Archiving a Passport invalidates all active shared links.
- A Passport can be exported even in `draft` status for user preview.

---

## 4. Resume

**Context**: Resume Builder

**Purpose**: A Resume is a targeted, formatted presentation of selected Claims from a Career Passport. Unlike the Passport, which is comprehensive, a Resume is optimized for a specific audience and purpose.

**Key Attributes**:

| Attribute        | Type            | Description                                                     |
| ---------------- | --------------- | --------------------------------------------------------------- |
| `resumeId`       | ResumeId (UUID) | Globally unique identifier                                      |
| `passportId`     | PassportId      | Source passport                                                 |
| `title`          | string          | Resume name (e.g., "Software Engineer - Acme Corp Application") |
| `target`         | ResumeTarget    | Target role, industry, or company                               |
| `template`       | TemplateId      | Selected template                                               |
| `format`         | ExportFormat    | `pdf`, `html`, `json`, `docx`                                   |
| `status`         | ResumeStatus    | `draft`, `complete`, `archived`                                 |
| `createdAt`      | Timestamp       | Creation timestamp                                              |
| `lastModifiedAt` | Timestamp       | Last modification timestamp                                     |

**Lifecycle**:

1. **Created**: User initiates resume creation from passport.
2. **Configured**: Target, template, and selected claims are configured.
3. **Generated**: The resume is rendered in the chosen format.
4. **Exported**: The resume is downloaded or shared externally.
5. **Archived**: User archives outdated resumes.

**Relationships**:

- Belongs to exactly one CareerPassport (1:1)
- References zero or more Claims (M:N through selection)
- Has zero or more ResumeVersions (1:N)

**Business Rules**:

- A Resume may include only Claims that belong to the parent Passport.
- A Resume must have at least one section containing at least one Claim.
- A Resume may reference unverified Claims if explicitly configured by the user.
- Templates must not modify the underlying Claim data; they only control presentation.
- Each Resume version stores the exact set of Claims and order at time of generation.

---

## 5. Claim

**Context**: Knowledge System

**Purpose**: A Claim is a single atomic statement about an Identity's professional history. It is the foundational data unit of the platform. Every Claim must be backed by Evidence to achieve verified status.

**Key Attributes**:

| Attribute         | Type                       | Description                                                                                                  |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `claimId`         | ClaimId (UUID)             | Globally unique identifier                                                                                   |
| `identityId`      | IdentityId                 | Owning identity                                                                                              |
| `type`            | ClaimType                  | `employment`, `education`, `certification`, `skill`, `achievement`, `project`, `publication`, `volunteering` |
| `title`           | string                     | Claim title (e.g., "Senior Software Engineer")                                                               |
| `description`     | string (optional)          | Detailed description                                                                                         |
| `temporalScope`   | DateRange                  | When the claim was active                                                                                    |
| `status`          | ClaimStatus                | `unverified`, `pending`, `verified`, `disputed`, `rejected`                                                  |
| `confidenceScore` | ConfidenceScore (computed) | Aggregated confidence                                                                                        |
| `trustScore`      | TrustScore (computed)      | Aggregated trust                                                                                             |
| `createdAt`       | Timestamp                  | Creation timestamp                                                                                           |
| `lastModifiedAt`  | Timestamp                  | Last modification timestamp                                                                                  |

**Lifecycle**:

1. **Created**: User submits a claim. Status is `unverified`.
2. **Evidence Attached**: Evidence is submitted. Status becomes `pending` if evidence is under review.
3. **Verified**: Verification confirms the claim. Status becomes `verified`.
4. **Disputed**: A verifier or consumer challenges the claim. Status becomes `disputed`.
5. **Rejected**: Verification determines the claim is invalid. Status becomes `rejected`.
6. **Superseded**: A newer version of the claim replaces this one (e.g., updated job title).

**Relationships**:

- Belongs to exactly one Identity (1:1)
- Owned by the CareerPassport in aggregate (N:1)
- Has one or more Evidence nodes (1:N). At least one is required for `verified` status.
- May be linked to other Claims through Knowledge Edge (M:N)
- Maps to a KnowledgeNode (1:1) in the Knowledge Graph

**Business Rules**:

- A Claim must have a valid DateRange with a start date. End date is optional (present role).
- A Claim of type `employment` must reference an Organization (via Knowledge Edge).
- A Claim's status cannot go from `verified` back to `unverified`; it must be `disputed` first.
- A Claim with `rejected` status triggers notification to the owning Identity.
- A Claim is immutable after creation. Corrections create a new Claim with supersedes link.
- The Confidence Score is computed and cached, never stored as a direct attribute.

---

## 6. Evidence

**Context**: Verification

**Purpose**: Evidence is information that supports or refutes a Claim. It is the foundation of trust in Patorbit. Evidence may be a document, a link, an API verification, a digital credential, or an attestation.

**Key Attributes**:

| Attribute            | Type                 | Description                                                                                                                 |
| -------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `evidenceId`         | EvidenceId (UUID)    | Globally unique identifier                                                                                                  |
| `claimId`            | ClaimId              | The claim this evidence supports                                                                                            |
| `type`               | EvidenceType         | `document`, `link`, `email_verification`, `api_verification`, `blockchain_attestation`, `ai_extraction`, `peer_endorsement` |
| `source`             | EvidenceSource       | Description of where this evidence came from                                                                                |
| `contentHash`        | ContentHash          | Cryptographic hash of the evidence content                                                                                  |
| `status`             | EvidenceStatus       | `submitted`, `accepted`, `rejected`, `challenged`                                                                           |
| `verificationStatus` | VerificationStatus   | `unverified`, `pending`, `verified`, `failed`                                                                               |
| `submittedAt`        | Timestamp            | Submission timestamp                                                                                                        |
| `acceptedAt`         | Timestamp (optional) | When accepted after quality check                                                                                           |

**Lifecycle**:

1. **Submitted**: User uploads or links evidence. Status is `submitted`.
2. **Accepted**: Quality and format check passes. Status becomes `accepted`.
3. **Verified**: Verification process confirms authenticity. Status becomes `verified`.
4. **Rejected**: Evidence fails quality or authenticity checks. Status becomes `rejected`.
5. **Challenged**: A verifier or consumer raises concerns. Status becomes `challenged`.

**Relationships**:

- Belongs to exactly one Claim (1:1)
- Has zero or more Verifications (1:N)
- Maps to a KnowledgeNode (1:1)

**Business Rules**:

- Evidence content is immutable after acceptance. Corrections require new evidence submission.
- Evidence must pass automated quality checks (file type, size, virus scan) before acceptance.
- Evidence of type `document` must be a supported format (PDF, PNG, JPG, DOCX).
- Evidence of type `link` must be a reachable URL with relevant content.
- Evidence of type `email_verification` must come from an approved domain.
- Evidence content hash must match at acceptance time to prevent tampering.
- The same Evidence cannot be linked to multiple Claims.

---

## 7. Verification

**Context**: Verification

**Purpose**: A Verification records the outcome of verifying that Evidence is authentic and correctly supports its Claim. Verifications are performed by Verifiers (human or automated).

**Key Attributes**:

| Attribute        | Type                      | Description                                       |
| ---------------- | ------------------------- | ------------------------------------------------- |
| `verificationId` | VerificationId (UUID)     | Globally unique identifier                        |
| `evidenceId`     | EvidenceId                | The evidence being verified                       |
| `verifierId`     | VerifierId                | The entity performing verification                |
| `verdict`        | Verdict                   | `verified`, `rejected`, `indeterminate`           |
| `confidence`     | ConfidenceScore (0.0–1.0) | Verifier's confidence in their verdict            |
| `notes`          | string (optional)         | Verifier's notes                                  |
| `completedAt`    | Timestamp                 | When verification completed                       |
| `expiresAt`      | Timestamp (optional)      | When verification expires (needs re-verification) |

**Lifecycle**:

1. **Requested**: Verification is requested for an Evidence node.
2. **Assigned**: A Verifier (automated or human) is assigned.
3. **In Progress**: Verifier examines the evidence.
4. **Completed**: Verdict is recorded. Verification is complete.
5. **Challenged**: The verdict is challenged. May reopen.
6. **Expired**: Verification period ends, requiring re-verification.

**Relationships**:

- Belongs to exactly one Evidence (1:1)
- Performed by exactly one Verifier (1:1)
- Produces exactly one VerificationRecord (1:1)

**Business Rules**:

- A Verifier cannot verify Evidence for which they are the subject (Identity) or issuer (Organization).
- Verification by an Organization carries higher weight than individual or automated verification.
- A Verification may be challenged within 30 days of completion.
- Automated verifications (AI document analysis) must be verified by a human if the AI's confidence is below 0.9.
- Verification of expired Evidence requires fresh evidence submission.

---

## 8. Organization

**Context**: Organizations

**Purpose**: An Organization is a recognized entity that employs individuals, issues credentials, verifies claims, and participates in the talent marketplace.

**Key Attributes**:

| Attribute           | Type                  | Description                                          |
| ------------------- | --------------------- | ---------------------------------------------------- |
| `organizationId`    | OrganizationId (UUID) | Globally unique identifier                           |
| `name`              | string                | Legal or operating name                              |
| `legalName`         | string (optional)     | Registered legal name                                |
| `domain`            | Domain                | Primary email domain                                 |
| `status`            | OrgStatus             | `registered`, `verified`, `suspended`, `deactivated` |
| `verificationLevel` | OrgVerificationLevel  | `unverified`, `domain_verified`, `legally_verified`  |
| `trustScore`        | TrustScore (computed) | Organizational trust                                 |
| `size`              | OrgSize (optional)    | Employee count range                                 |
| `industry`          | string (optional)     | Primary industry                                     |
| `createdAt`         | Timestamp             | Registration timestamp                               |
| `verifiedAt`        | Timestamp (optional)  | When organization was verified                       |

**Lifecycle**:

1. **Registered**: Organization account is created. Status is `registered`.
2. **Domain Verified**: Organization proves ownership of email domain. Status progresses to `domain_verified`.
3. **Legally Verified**: Organization provides legal documentation. Status becomes `legally_verified`.
4. **Active**: Organization is fully operational with verified status.
5. **Suspended**: Policy violation or payment failure triggers suspension.
6. **Deactivated**: Organization ceases operations on platform.

**Relationships**:

- Has one or more Workspaces (1:N)
- Employs zero or more Identities (N:M through OrganizationMember)
- Issues zero or more Credentials (1:N)
- Verifies zero or more Claims (1:N through Verifier role)
- Owns zero or more Domains (1:N)

**Business Rules**:

- An Organization must verify domain ownership before issuing credentials or verifying employee claims.
- An Organization's Trust Score is seeded from its verification level and updated based on verification activity.
- An Organization can have multiple Workspaces but must have at least one.
- Domain verification must be renewed every 12 months.
- An Organization cannot be deleted if it has issued credentials; it can only be deactivated.

---

## 9. Workspace

**Context**: Organizations

**Purpose**: A Workspace is a collaborative environment within an Organization where members manage verification, recruitment, and operations. Different Workspace types serve different purposes (e.g., verification team, recruitment team).

**Key Attributes**:

| Attribute        | Type                      | Description                                     |
| ---------------- | ------------------------- | ----------------------------------------------- |
| `workspaceId`    | WorkspaceId (UUID)        | Globally unique identifier                      |
| `organizationId` | OrganizationId            | Parent organization                             |
| `type`           | WorkspaceType             | `verification`, `recruitment`, `administration` |
| `name`           | string                    | Workspace display name                          |
| `subscriptionId` | SubscriptionId (optional) | Active subscription                             |
| `settings`       | WorkspaceSettings         | Workspace-specific configuration                |
| `createdAt`      | Timestamp                 | Creation timestamp                              |

**Lifecycle**:

1. **Created**: Created automatically with Organization registration (default workspace).
2. **Configured**: Settings, members, and subscription are configured.
3. **Active**: Workspace is operational.
4. **Suspended**: Subscription lapses or organization is suspended.
5. **Archived**: Workspace is no longer active.

**Relationships**:

- Belongs to exactly one Organization (1:1)
- Has one or more Members (OrganizationMember) (1:N)
- Has zero or one Subscription (1:1)

**Business Rules**:

- A Workspace must have at least one admin member.
- A Workspace's feature set is determined by its Subscription plan.
- Workspace data is isolated from other Workspaces within the same Organization.
- Private data within a Workspace is accessible only to its members based on their roles.

---

## 10. Subscription

**Context**: Billing

**Purpose**: A Subscription represents a paid plan that governs feature access for a Workspace or Identity. It links billing to entitlements.

**Key Attributes**:

| Attribute            | Type                         | Description                                  |
| -------------------- | ---------------------------- | -------------------------------------------- |
| `subscriptionId`     | SubscriptionId (UUID)        | Globally unique identifier                   |
| `subscriberId`       | IdentityId or OrganizationId | Owning entity                                |
| `subscriberType`     | SubscriberType               | `individual`, `organization`                 |
| `plan`               | PlanType                     | `free`, `professional`, `team`, `enterprise` |
| `status`             | SubscriptionStatus           | `active`, `past_due`, `canceled`, `expired`  |
| `currentPeriodStart` | Timestamp                    | Billing period start                         |
| `currentPeriodEnd`   | Timestamp                    | Billing period end                           |
| `autoRenew`          | boolean                      | Whether subscription auto-renews             |
| `canceledAt`         | Timestamp (optional)         | When subscription was canceled               |

**Lifecycle**:

1. **Activated**: Payment successful, subscription becomes `active`.
2. **Active**: Services are accessible based on plan entitlements.
3. **Past Due**: Payment failed. Grace period begins.
4. **Canceled**: User or system cancels. Services continue until period end.
5. **Expired**: Period ends with no renewal. Services downgraded to free tier.

**Relationships**:

- Belongs to exactly one subscriber (Identity or Organization) (1:1)
- Has zero or more Invoices (1:N)
- Has zero or more Payments (1:N)

**Business Rules**:

- A Subscription must specify its billing period (monthly or annual).
- Downgrading takes effect at the end of the current billing period.
- Subscription cancellation does not delete data; it downgrades access.
- Enterprise subscriptions may have custom terms and billing.
- A Workspace cannot exceed its plan's limits (e.g., maximum members, verification requests).

---

## 11. Credential

**Context**: Verification (issuance sub-domain)

**Purpose**: A Credential is a verified digital representation of a qualification, certification, or affiliation issued by a recognized authority. Credentials are a high-trust form of Evidence.

**Key Attributes**:

| Attribute      | Type                 | Description                                                 |
| -------------- | -------------------- | ----------------------------------------------------------- |
| `credentialId` | CredentialId (UUID)  | Globally unique identifier                                  |
| `issuerId`     | OrganizationId       | Issuing organization                                        |
| `subjectId`    | IdentityId           | Credential recipient                                        |
| `type`         | CredentialType       | `degree`, `certification`, `license`, `badge`, `membership` |
| `title`        | string               | Credential name                                             |
| `issuedAt`     | Timestamp            | Issuance date                                               |
| `expiresAt`    | Timestamp (optional) | Expiry date                                                 |
| `status`       | CredentialStatus     | `active`, `expired`, `revoked`, `suspended`                 |
| `metadata`     | JSON                 | Credential-specific metadata                                |
| `signature`    | DigitalSignature     | Cryptographic signature for verifiability                   |

**Lifecycle**:

1. **Issued**: Organization issues credential to Identity. Status is `active`.
2. **Active**: Credential is valid and verifiable.
3. **Expired**: Credential reaches expiration date. Status changes to `expired`.
4. **Revoked**: Issuer revokes credential. Status becomes `revoked`.
5. **Suspended**: Temporary suspension pending investigation.

**Relationships**:

- Issued by exactly one Organization (1:1)
- Received by exactly one Identity (1:1)
- Maps to an Evidence node (1:1) linked to one or more Claims
- May reference a Verification record

**Business Rules**:

- A Credential must be digitally signed by the issuing Organization.
- Revocation is irreversible. A revoked Credential cannot be reinstated.
- An expired Credential contributes zero weight to Trust Score but remains in history.
- An Organization can only issue Credentials for domains they own.
- Self-issued Credentials are allowed but have minimum Source Trust.

---

## 12. Verifier

**Context**: Verification

**Purpose**: A Verifier is an entity (human or automated) authorized to perform Verifications on Evidence. Verifiers can be platform-internal systems (AI), platform-certified individuals, or Organizations.

**Key Attributes**:

| Attribute           | Type                      | Description                                 |
| ------------------- | ------------------------- | ------------------------------------------- |
| `verifierId`        | VerifierId (UUID)         | Globally unique identifier                  |
| `type`              | VerifierType              | `ai_system`, `human`, `organization`        |
| `identityId`        | IdentityId (optional)     | Associated identity (for human verifiers)   |
| `organizationId`    | OrganizationId (optional) | Associated organization                     |
| `status`            | VerifierStatus            | `active`, `suspended`, `deactivated`        |
| `trustScore`        | TrustScore (computed)     | Verifier's historical accuracy              |
| `verificationCount` | int                       | Total verifications performed               |
| `accuracy`          | float (0.0–1.0)           | Historical accuracy rate                    |
| `certifiedAt`       | Timestamp (optional)      | When verifier was certified                 |
| `specializations`   | ClaimType[]               | Types of claims the verifier specializes in |

**Lifecycle**:

1. **Onboarded**: Verifier is registered (AI system deployed, human trained, organization verified).
2. **Active**: Verifier can accept and perform verifications.
3. **Suspended**: Accuracy drops below threshold or policy violation.
4. **Deactivated**: Verifier is removed from the system.

**Relationships**:

- Performs zero or more Verifications (1:N)
- Optionally associated with an Identity (1:1)
- Optionally associated with an Organization (1:1)

**Business Rules**:

- A Verifier's Trust Score is updated after each Verification based on accuracy.
- AI verifiers must be versioned; verification records track the AI model version used.
- A human Verifier must complete certification training before verification privileges are granted.
- A Verifier cannot verify Evidence from a Claim where they have a conflict of interest.
- Verifier accuracy below 0.6 triggers automatic suspension and re-training.

## References

- [Value Objects](value-objects.md): Value types used as entity attributes.
- [Aggregates](aggregates.md): Aggregate boundaries and consistency rules.
- [Domain Model](domain-model.md): Entity relationship diagram.
- [Ubiquitous Language](ubiquitous-language.md): Canonical definitions.
