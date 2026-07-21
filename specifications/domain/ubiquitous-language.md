# Ubiquitous Language

## Purpose

This document defines the canonical business vocabulary for the Patorbit platform. Every term used in requirements, design discussions, code, and documentation must conform to these definitions. A shared language eliminates ambiguity and ensures that product managers, engineers, designers, and stakeholders communicate with precision.

## Scope

This glossary covers all core domain concepts across every bounded context. Terms are organized by conceptual domain and cross-referenced where relationships exist.

---

## Core Identity Terms

### Identity

The unique, verified representation of a person within the Patorbit platform. An Identity is established through registration and strengthened over time through verification, credential linking, and platform activity.

- **Business Meaning**: An Identity is the root of all user activity. It owns Claims, Resumes, and the Career Passport. An Identity can be associated with one or more Organizations.
- **Rules**:
  - An Identity must have at least one verified email address.
  - An Identity may link external authentication providers.
  - An Identity cannot be deleted if it has published Passports; only deactivated.
  - An Identity is globally unique.
- **Related Terms**: User, Profile, Account

### User

The active representation of an Identity interacting with the platform. A User is an Identity that has authenticated and holds a session.

- **Business Meaning**: The User is the runtime actor. Permissions, preferences, and session state are attached to the User, not the underlying Identity.
- **Rules**:
  - A User maps 1:1 to an Identity.
  - A User may hold multiple roles (e.g., individual + recruiter).
  - A User's session carries their current role selection.
- **Related Terms**: Identity, Recruiter, Organization Member

### Profile

The public, curated presentation of an Identity's professional information. The Profile is derived from verified Claims and may be selectively shared.

- **Business Meaning**: The Profile is the face of the Identity to the outside world. It is a projection of underlying Claims, not a separate data store.
- **Rules**:
  - A Profile may include only verified or confident Claims.
  - A Profile can have multiple versions (public, recruiter-only, organization-only).
  - Profile visibility is governed by sharing Preferences.
- **Related Terms**: Career Passport, Claim, Visibility

---

## Career Terms

### Career Passport

A comprehensive, verifiable digital document that aggregates an individual's professional history, skills, credentials, and achievements. Unlike a traditional resume, a Career Passport is built on Claims backed by Evidence and V

- **Business Meaning**: The Career Passport is the primary output of the Patorbit platform. It is a living document that evolves as the individual's career progresses. It serves as the canonical source of professional truth for the Identity.
- **Rules**:
  - A Passport is owned by exactly one Identity.
  - A Passport is composed of Claims, not text blobs.
  - A Passport can be published in multiple Versions.
  - A published Passport is immutable; changes create a new Version.
  - A Passport may include a verifiable digital signature for tamper evidence.
- **Related Terms**: Resume, Claim, Evidence, Version, Snapshot, Publication

### Resume

A specific, ordered presentation of selected Claims from a Career Passport, formatted for a target audience (e.g., job application). A Resume is a view over the Passport.

- **Business Meaning**: Resumes are concrete outputs derived from the Passport. They are templates that select, order, and format Claims for specific use cases. Unlike the Passport, Resumes may omit low-confidence or unverified Claims.
- **Rules**:
  - A Resume is a projection of the Passport, not a separate data source.
  - A Resume must declare its target audience (e.g., general, recruiter, specific company).
  - A Resume may include only Claims with Confidence Score above a configurable threshold.
  - A Resume can be exported to PDF, JSON, or HTML.
- **Related Terms**: Career Passport, Claim, Template, Publication

### Claim

A single atomic statement about an Identity's professional history, skill, or attribute. Examples include "Worked at Acme Corp as Senior Engineer from 2020-2023," or "Holds AWS Solutions Architect certification."

- **Business Meaning**: Claims are the atomic units of professional truth. Every Claim must be backed by at least one piece of Evidence to be considered valid. Claims are the building blocks of both Resumes and the Career Passport.
- **Rules**:
  - A Claim must have a type (e.g., employment, education, certification, skill, achievement).
  - A Claim must have a temporal scope (start date, optional end date).
  - A Claim must reference at least one Evidence node to achieve Verified status.
  - A Claim without Evidence is marked as Unverified.
  - A Claim may be linked to other Claims (e.g., "Used Python at Acme Corp" links skill Claim to employment Claim).
  - A Claim is owned by exactly one Identity.
- **Related Terms**: Evidence, Verification, Credential, Confidence Score, Knowledge Node

---

## Trust and Verification Terms

### Evidence

A piece of information that supports or refutes a Claim. Evidence may be a document upload, a verified email from an organization, a link to a public profile, a blockchain attestation, or an AI-extracted data point.

- **Business Meaning**: Evidence is the foundation of trust in Patorbit. Without Evidence, a Claim has zero intrinsic Trust. Evidence varies in quality, and its quality directly affects the Confidence and Trust assigned to the linked Claim.
- **Rules**:
  - Evidence must be of a defined type: `document`, `link`, `email_verification`, `api_verification`, `blockchain_attestation`, `ai_extraction`, `peer_endorsement`.
  - Evidence must be associated with exactly one Claim.
  - Evidence carries a Source Trust Score that contributes to the Claim's Confidence.
  - Evidence may be challenged by a Verifier, triggering a review workflow.
  - Evidence is immutable once accepted; corrections create new Evidence.
- **Related Terms**: Claim, Verification, Source Trust Score, Verifier

### Verification

The process of confirming that Evidence is authentic, accurate, and correctly supports its associated Claim. A Verification produces a Verification Record.

- **Business Meaning**: Verification is the act of validation. It can be performed by automated systems (AI document analysis, organizational API), by trusted entities (Organization verification portal), or by human Verifiers (certified third parties). The result is a Verdict: Verified, Rejected, or Indeterminate.
- **Rules**:
  - A Verification always references exactly one Evidence node.
  - A Verification produces a Verdict enum: `verified`, `rejected`, `indeterminate`.
  - A Verification may include a Confidence Score from the verifier.
  - Verification by an Organization has higher weight than automated verification.
  - A successfully verified Evidence increases the Trust Score of the linked Claim.
- **Related Terms**: Evidence, Verifier, Verdict, Confidence Score, Trust Score

### Credential

A verified digital representation of a qualification, certification, or affiliation issued by a recognized authority. Credentials are a specific subtype of Evidence.

- **Business Meaning**: Credentials are high-trust Evidence because they are issued by authoritative sources. A university degree, a professional certification, or an organizational role confirmation are all Credentials. They carry inherent Source Trust.
- **Rules**:
  - A Credential must have an Issuer (the organization that granted it).
  - A Credential may be self-issued but carries very low Source Trust.
  - A Credential has an expiry date if applicable.
  - A Credential may be revoked by its Issuer.
  - Revocation invalidates the Credential and reduces Trust of linked Claims.
- **Related Terms**: Evidence, Issuer, Organization, Verification

### Verifier

An entity (human or automated) that performs Verification on Evidence. Verifiers may be platform-internal (AI systems, document analysis) or external (certified organizations, professional verifiers).

- **Business Meaning**: Verifiers are actors in the trust ecosystem. Their reputation and authority determine the weight of their Verdict. The platform may certify external Verifiers.
- **Rules**:
  - A Verifier has a Verifier Trust Score based on historical accuracy.
  - A Verifier may be an Organization acting on behalf of its members.
  - A Verifier cannot verify Evidence for which they are the Subject or Issuer.
  - Verifier actions are audited and stored as Events.
- **Related Terms**: Verification, Verifier Trust Score, Organization

### Trust Score

A numerical score (0.0–1.0) representing the reliability of a Claim, Evidence node, Verifier, or Organization within the platform.

- **Business Meaning**: Trust Scores are computed, not stored. They aggregate multiple signals including Verification history, Evidence quality, source authority, and age. Every node in the Knowledge Graph carries a Trust Score.
- **Rules**:
  - Trust Score is a computed value object, recalculated when contributing factors change.
  - Trust Score ranges from 0.0 (no trust) to 1.0 (maximum trust).
  - Trust Scores decay over time without new Verification activity.
  - A Claim's Trust Score is the weighted aggregate of its Evidence nodes' Trust Scores.
- **Related Terms**: Confidence Score, Trust Model, Evidence, Verification

### Confidence Score

A numerical score (0.0–1.0) representing the system's confidence that a Claim is accurate. Confidence differs from Trust in that it incorporates AI-derived signals, source credibility, and statistical inference.

- **Business Meaning**: While Trust is about verification, Confidence is about certainty. A Claim may have high Confidence even before formal Verification if backed by high-quality, credible Evidence from authoritative sources.
- **Rules**:
  - Confidence Score is computed from multiple factors: Evidence quality, Source Trust, Verification status, Age of Evidence, AI analysis.
  - Confidence Score is always ≤ Trust Score for verified Claims.
  - For unverified Claims, Confidence Score may be > 0 based on source credibility alone.
  - Confidence Score is recalculated when new Evidence or Verification is added.
- **Related Terms**: Trust Score, Confidence Model, Evidence, Source Trust

---

## Knowledge Terms

### Knowledge

The structured, interconnected body of information within the Patorbit platform. Knowledge encompasses all Claims, Evidence, Credentials, Relationships, and derived insights.

- **Business Meaning**: Knowledge is the platform's central asset. It is represented as a graph where nodes are Claims, Evidence, Identities, and Organizations, and edges represent relationships, provenance, and verification. Knowledge is not static; it evolves through user activity, verification events, and AI enrichment.
- **Rules**:
  - Every piece of Knowledge is traceable to its source (provenance).
  - Knowledge may be public, restricted, or private based on Visibility rules.
  - Knowledge relationships are typed and directional.
  - Knowledge is immutable once committed; corrections create new nodes with lineage links.
- **Related Terms**: Knowledge Graph, Knowledge Node, Knowledge Edge, Provenance

### Knowledge Node

A single atomic unit of Knowledge. Nodes correspond to domain entities such as Claims, Evidence, Identities, Organizations, Credentials, and Skills.

- **Business Meaning**: Every node in the knowledge graph is a first-class citizen with its own identity, Trust Score, timestamps, and provenance chain.
- **Rules**:
  - Every node has a globally unique identifier.
  - Every node has a type from a defined taxonomy.
  - Every node carries metadata (created, updated, source, confidence).
  - Nodes can be related to other nodes through Knowledge Edges.
- **Related Terms**: Knowledge Graph, Entity, Knowledge Edge

### Knowledge Edge

A typed, directional relationship between two Knowledge Nodes. Edges represent connections such as "employed by," "holds certification," "supported by evidence," or "verified by."

- **Business Meaning**: Edges give the graph its semantic power. They enable traversal queries like "Find all employees of Acme Corp who hold an AWS certification and have been verified by an external verifier."
- **Rules**:
  - Every Edge has a type from a defined relationship taxonomy.
  - Every Edge has a direction.
  - Every Edge carries a Confidence Score.
  - Edges may have temporal constraints (valid from, valid until).
  - Edges are immutable once created; corrections create new Edges with supersedes links.
- **Related Terms**: Knowledge Graph, Knowledge Node, Relationship Taxonomy

### Provenance

The documented lineage of a Knowledge Node, tracing its origin, transformations, and chain of custody.

- **Business Meaning**: Provenance is essential for trust. Every node records its origin (user-submitted, AI-extracted, API-imported, verifier-asserted), every transformation it has undergone, and every actor that has touched it. This creates an auditable chain of trust.
- **Rules**:
  - Provenance is append-only.
  - Each provenance record includes actor, action, timestamp, and previous state reference.
  - Provenance chains are cryptographically verifiable for signed artifacts.
  - Provenance data is immutable.
- **Related Terms**: Knowledge Node, Audit Log, Version

---

## Temporal Terms

### Version

A specific, immutable state of a Career Passport, Resume, or any versioned artifact. Versions are created each time the owner publishes or saves a snapshot.

- **Business Meaning**: Versioning ensures that once a Passport or Resume is shared, the recipient sees a fixed representation that cannot be altered retroactively. Each version is independently addressable.
- **Rules**:
  - Versions are immutable after creation.
  - Versions are sequentially numbered within their parent artifact.
  - Each Version carries a timestamp and change summary.
  - Versions may be compared (diff) to show changes.
- **Related Terms**: Snapshot, Publication, Career Passport, Resume

### Snapshot

A point-in-time capture of a Career Passport's complete state. Snapshots are internal versions used for comparison, rollback, and export.

- **Business Meaning**: Snapshots are the internal mechanism for versioning. They are created automatically on significant changes (publish, share, export) or on-demand by the user.
- **Rules**:
  - Snapshots are automatically created on publish and export events.
  - Snapshots are retained indefinitely for audit purposes.
  - Users may manually create snapshots before major edits.
  - A Snapshot can be promoted to a Version for external sharing.
- **Related Terms**: Version, Publication, Audit Log

### Publication

The act of making a Career Passport or Resume available to an external audience (recruiters, organizations, public). A Publication creates a frozen version and generates a shareable link or verifiable document.

- **Business Meaning**: Publication is the boundary between private and shared. Once published, the artifact becomes discoverable (based on visibility settings) and gains a permanent URL and/or digital signature.
- **Rules**:
  - A Publication produces an immutable artifact.
  - A Publication may have an expiry date.
  - A Publication may be revoked, which invalidates the shareable link.
  - Revocation does not delete the artifact; it marks it as unpublished.
- **Related Terms**: Version, Snapshot, Career Passport, Resume

---

## Organizational Terms

### Organization

A recognized entity within the Patorbit platform that can employ individuals, issue credentials, perform verifications, and recruit talent. Organizations range from small companies to large enterprises.

- **Business Meaning**: Organizations are first-class participants in the trust ecosystem. They can verify Claims for their members, issue Credentials, post opportunities, and access anonymized talent insights.
- **Rules**:
  - An Organization must be verified to perform verifications on behalf of its domain.
  - An Organization has a Trust Score based on its verification history and reputation.
  - An Organization may have multiple Workspaces.
  - Organizations can claim domain ownership (e.g., @acme.com) to auto-verify email-based Evidence.
- **Related Terms**: Workspace, Organization Member, Issuer, Verifier

### Workspace

A collaborative environment within an Organization where members manage verification, recruitment, and talent operations.

- **Business Meaning**: Workspaces are the operational unit for organizations. Each Workspace has its own members, permissions, and activity stream. A large organization may have multiple Workspaces (e.g., by department or region).
- **Rules**:
  - A Workspace belongs to exactly one Organization.
  - A Workspace has one or more members with defined roles.
  - A Workspace may have a subscription plan that determines feature access.
  - Data within a Workspace is isolated from other Workspaces.
- **Related Terms**: Organization, Organization Member, Subscription

### Issuer

An Organization or individual authorized to issue Credentials. Issuers are trusted entities whose assertions carry weight in the trust ecosystem.

- **Business Meaning**: Issuers are the authoritative sources of Credentials. A university issuing degrees, a certification body issuing professional certificates, or an employer issuing employment verification letters are all Issuers. Issuer status conveys privileges and responsibilities.
- **Rules**:
  - An Issuer must complete a verification process to be recognized.
  - An Issuer has an Issuer Trust Score based on history.
  - An Issuer may revoke Credentials it has issued.
  - Revocation creates an event that propagates through the Knowledge Graph.
- **Related Terms**: Credential, Organization, Verifier

---

## Consumer Terms

### Consumer

An entity (person or system) that views, evaluates, or processes Career Passports, Resumes, or Claims. Consumers include recruiters, hiring managers, AI screening systems, and API integrations.

- **Business Meaning**: Consumers are the audience for published career artifacts. The platform serves Consumers by providing trusted, verifiable information with appropriate access controls. Consumer behavior (views, verifications requested) feeds back into the Confidence Model.
- **Rules**:
  - A Consumer may be authenticated or anonymous.
  - Anonymous Consumers see only public artifacts.
  - Authenticated Consumers' interactions are recorded for analytics.
  - Consumers may request verification of specific Claims, triggering workflows.
- **Related Terms**: Recruiter, Verifier, Access Control

### Recruiter

A Consumer who uses the platform to discover, evaluate, and engage with talent. Recruiters operate within the Recruiter Workspace.

- **Business Meaning**: Recruiters are a key customer segment. They benefit from verified, high-confidence career data that reduces screening time and improves hiring decisions. Recruiters can verify Claims through organizational channels.
- **Rules**:
  - A Recruiter must have an Identity and may be affiliated with an Organization.
  - A Recruiter can search for candidates based on verified Claims.
  - A Recruiter can request verification from candidates.
  - Recruiter activity is subject to usage limits based on subscription.
- **Related Terms**: Consumer, Recruiter Workspace, Organization

---

## Temporal Terms

### Timeline

A chronologically ordered sequence of Claims, Evidence, and Verifications associated with an Identity. The Timeline is the temporal backbone of the Career Passport.

- **Business Meaning**: The Timeline organizes all career events in chronological order. It provides context for evaluating career progression, employment gaps, and skill acquisition patterns.
- **Rules**:
  - Every Claim has a position on the Timeline based on its date range.
  - Claims may overlap (e.g., concurrent employment or education).
  - The Timeline supports validation (e.g., no Claims before birth date, no Claims during verified absence).
  - AI services can analyze the Timeline for insights and recommendations.
- **Related Terms**: Career Passport, Claim, Date Range

---

## Cross-References

| Term             | Primary Document   | Bounded Context   |
| ---------------- | ------------------ | ----------------- |
| Identity         | entities.md        | Identity          |
| Career Passport  | entities.md        | Career Passport   |
| Resume           | entities.md        | Resume Builder    |
| Claim            | entities.md        | Knowledge System  |
| Evidence         | entities.md        | Verification      |
| Verification     | domain-services.md | Verification      |
| Credential       | entities.md        | Verification      |
| Trust Score      | value-objects.md   | Trust Engine      |
| Confidence Score | value-objects.md   | Confidence Engine |
| Knowledge Node   | knowledge-graph.md | Knowledge System  |
| Organization     | entities.md        | Organizations     |
| Workspace        | entities.md        | Organizations     |
| Version          | value-objects.md   | Career Passport   |
| Publication      | workflows.md       | Career Passport   |

---

## Version History

| Version | Date       | Author | Changes                      |
| ------- | ---------- | ------ | ---------------------------- |
| 1.0.0   | 2026-07-21 | PKS    | Initial canonical vocabulary |
