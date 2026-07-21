# Workflows

## Purpose

This document defines the primary business workflows within the Patorbit platform. Workflows represent end-to-end processes that span multiple bounded contexts and domain services.

## Scope

This document covers all major business workflows, including user onboarding, resume creation, claim verification, evidence submission, passport publishing, recruiter verification, and AI resume generation.

---

## 1. User Onboarding

**Description**: The complete user registration and initial setup process, from account creation to passport initialization.

**Actors**: User, System

**Preconditions**:

- The user has no existing Patorbit account.
- The user has a valid email address.

**Postconditions**:

- The user has an active account with a verified email.
- An empty Career Passport has been created.
- A free tier subscription has been activated.

```mermaid
sequenceDiagram
    actor User
    participant Identity
    participant Passport
    participant Knowledge
    participant Billing

    User->>Identity: register(email, password)
    Identity->>Identity: validateEmail(email)
    Identity->>User: sendVerificationEmail()
    User->>Identity: verifyEmail(token)
    Identity->>Identity: activateAccount()
    Identity-->>User: welcomeMessage()

    par Initialize platform resources
        Identity->>Passport: UserRegistered
        Passport->>Passport: createEmptyPassport()
        Identity->>Knowledge: UserRegistered
        Knowledge->>Knowledge: createIdentityNode()
        Identity->>Billing: UserRegistered
        Billing->>Billing: activateFreeTier()
    end

    User->>User: completeProfile(name, headline)
    User->>Knowledge: createFirstClaim(type, details)
```

---

## 2. Resume Creation

**Description**: Creating a targeted resume from an existing Career Passport, from claim selection through to export.

**Actors**: User, System

**Preconditions**:

- The user has an active Career Passport with at least one claim.
- The user has a verified identity.

**Postconditions**:

- A new resume version is created from the selected claims.
- The resume is available in the chosen format.

```mermaid
sequenceDiagram
    actor User
    participant ResumeBuilder
    participant Passport
    participant AI
    participant Export

    User->>ResumeBuilder: createResume(passportId)
    ResumeBuilder->>Passport: getClaims(passportId)
    Passport-->>ResumeBuilder: claims[]

    User->>ResumeBuilder: selectClaims(claimIds)
    User->>ResumeBuilder: setTarget(role, industry)

    par Get suggestions
        ResumeBuilder->>AI: suggestOptimization(resumeId)
        AI-->>ResumeBuilder: suggestions[]
    end

    User->>ResumeBuilder: applyTemplate(templateId)
    ResumeBuilder->>ResumeBuilder: generatePreview()
    ResumeBuilder-->>User: previewHtml

    User->>ResumeBuilder: confirmAndExport(format)
    ResumeBuilder->>Export: render(resumeId, format)
    Export-->>User: downloadableFile
    ResumeBuilder->>ResumeBuilder: emit(ResumeGenerated)
```

---

## 3. Claim Verification

**Description**: The end-to-end workflow for verifying a professional claim, from submission through evidence collection and verification.

**Actors**: User, AI Verifier, Human Verifier (optional), System

**Preconditions**:

- The user has an active account.
- A claim exists in the user's passport.

**Postconditions**:

- The claim's status is updated to `verified` or `rejected`.
- The Trust Score is recalculated.
- The Knowledge Graph is updated with verification results.

```mermaid
sequenceDiagram
    actor User
    participant Claim
    participant Evidence
    participant Verification
    participant AI
    participant TrustEngine

    User->>Claim: createClaim(type, details)
    Claim-->>User: claimId
    User->>Evidence: submitEvidence(claimId, file)
    Evidence->>Evidence: qualityCheck(file)
    Evidence-->>User: evidenceAccepted

    Verification->>AI: requestAutomatedVerification(evidenceId)
    AI-->>Verification: aiVerdict(confidence)

    alt AI Confidence >= 0.9
        Verification->>Verification: autoVerify(evidenceId)
    else AI Confidence < 0.9
        Verification->>Verification: assignHumanVerifier(evidenceId)
        Verification-->>User: verificationPending
        Verification->>Verification: recordVerdict(verdict)
    end

    Verification->>TrustEngine: VerificationCompleted
    TrustEngine->>TrustEngine: recomputeClaimTrust(claimId)
    TrustEngine-->>Claim: trustUpdated
    Claim->>Claim: updateVerificationStatus()

    User->>Claim: checkStatus()
    Claim-->>User: verified with trust score
```

---

## 4. Passport Publishing

**Description**: Publishing a Career Passport, making selected claims visible and searchable by recruiters and organizations.

**Actors**: User, System

**Preconditions**:

- The user has a populated Career Passport with at least one claim.
- The user's email is verified.

**Postconditions**:

- An immutable version of the passport is created.
- The passport is discoverable based on visibility settings.
- A shareable link is generated.

```mermaid
sequenceDiagram
    actor User
    participant Passport
    participant VersionService
    participant Knowledge
    participant Recruiter

    User->>Passport: openPassport()
    Passport-->>User: passportDraft

    User->>Passport: reviewClaims()
    User->>Passport: setVisibility(level)
    User->>Passport: publish()

    Passport->>VersionService: createSnapshot()
    VersionService-->>Passport: versionNumber

    Passport->>Passport: freezeVersion(versionNumber)

    par Post-publishing actions
        Passport->>Knowledge: updateNodeVisibility()
        Passport->>Recruiter: PassportPublished
        Recruiter->>Recruiter: indexForSearch()
        Passport->>User: generateShareableLink()
    end

    User-->>User: shareLink(recipients)
```

---

## 5. Record Submission (with Evidence)

**Description**: The workflow for a user to add or update a professional record, including the linking of supporting evidence.

**Actors**: User, System

**Preconditions**:

- User has an active Career Passport.

**Postconditions**:

- A new claim is created with the provided details.
- The evidence has been submitted and queued for verification.

```mermaid
sequenceDiagram
    actor User
    participant Claim
    participant KnowledgeGraph
    participant Evidence
    participant AIService

    User->>+Claim: submitRecord(type, details, dates)
    Claim->>Claim: initializeStatus()
    Claim-->>User: claimId

    User->>Claim: attachLinkEvidence(url)
    Claim->>+Evidence: submitLink(url)
    Evidence-->>-Claim: evidenceId

    User->>Claim: attachDocumentEvidence(file)
    Claim->>+Evidence: submitDocument(file)
    Evidence-->>-Claim: evidenceId

    par Graph and AI processing
        Claim->>+KnowledgeGraph: mapClaimToNode(claimId)
        KnowledgeGraph-->>-Claim: nodeId
        Claim->>+AIService: generateInsights(claimId)
        AIService-->>-Claim: suggestions
    end

    Claim->>Claim: transitionToPending()
    Claim-->>User: claimPendingVerification
```

---

## 6. AI Resume Generation

**Description**: The AI-powered workflow for analyzing a passport and generating an optimized, tailored resume.

**Actors**: User, AI Service, System

**Preconditions**:

- User passport has at least one claim.

**Postconditions**:

- An AI-optimized resume is created with suggestions.

```mermaid
sequenceDiagram
    actor User
    participant ResumeBuilder
    participant AIService
    participant KnowledgeGraph
    participant Passport

    User->>ResumeBuilder: requestAIGeneration(passportId, target)
    ResumeBuilder->>Passport: getCompletePassport(passportId)

    par Knowledge retrieval
        Passport-->>ResumeBuilder: claims, evidence, verification[]
        ResumeBuilder->>KnowledgeGraph: findRelatedSkills(identityId)
        KnowledgeGraph-->>ResumeBuilder: skillRecommendations
    end

    ResumeBuilder->>AIService: generateOptimizedResume(passport, target)
    AIService->>AIService: analyzeClaimStrength()
    AIService->>AIService: orderByRelevance(target)

    AIService-->>ResumeBuilder: orderedClaims[], suggestions[]

    User->>ResumeBuilder: reviewAIDraft()

    User->>ResumeBuilder: acceptSuggestions()
    ResumeBuilder->>ResumeBuilder: finalizeResume()

    ResumeBuilder-->>User: resumeReadyForExport
```

---

## 7. Recruiter Verification

**Description**: The process by which an organization verifies a claim on behalf of a current or past employee.

**Actors**: Candidate, Organization, Recruiter, System

**Preconditions**:

- The candidate has a claim referencing the organization.
- The organization has verified its domain.

**Postconditions**:

- The claim is verified with high trust weight (organization-level trust).

```mermaid
sequenceDiagram
    actor Candidate
    actor Organization
    participant Claim
    participant Evidence
    participant Verification
    participant TrustEngine

    Candidate->>Claim: submitEmploymentClaim(orgId, role, dates)
    Candidate->>Evidence: requestOrgVerification(claimId)

    Evidence->>Organization: verificationRequest(candidateEmail, claim)

    Organization->>Organization: verifyEmail(candidateEmail)
    Organization->>Organization: confirmEmployment(claim)
    Organization-->>Verification: orgVerdict(verified)

    Verification->>Verification: recordOrgVerification(evidenceId)

    note over Verification,TrustEngine: Organization verification carries<br/>higher trust weight than AI or self-verification

    Verification->>TrustEngine: VerificationCompleted
    TrustEngine->>TrustEngine: recomputeTrust(claimId)
    TrustEngine-->>Claim: trustLevelUpdated(high)

    Candidates->>Claim: checkStatus()
    Claim-->>Candidate: orgVerified with trust score
```

---

## 8. Account Recovery

**Description**: The workflow for a user to regain access to their account after losing credentials.

**Actors**: User, System

**Preconditions**:

- User has a registered email.

**Postconditions**:

- User's password is reset and access is restored.

```mermaid
sequenceDiagram
    actor User
    participant Identity
    participant EmailService

    User->>Identity: requestPasswordReset(email)
    Identity->>Identity: lookUpAccount(email)
    alt Account not found
        Identity-->>User: accountNotFound
    else Account found
        Identity->>EmailService: sendResetCode(email)
        EmailService-->>User: resetCode
        User->>Identity: submitResetCode(code, newPassword)
        Identity->>Identity: validateCode(code)
        Identity->>Identity: updatePassword(newPassword)
        Identity-->>User: passwordUpdated
    end
```

---

## Workflow Summary

| Workflow                     | Context(s)                             | Key Events                                                   | Primitives                                           |
| ---------------------------- | -------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| User Onboarding              | Identity, Passport, Knowledge, Billing | `UserRegistered`, `IdentityVerified`                         | Registration form, email verification                |
| Resume Creation              | Resume Builder, Passport, AI           | `ResumeGenerated`                                            | Claim selection, target config, template application |
| Claim Verification           | Claim, Evidence, Verification, Trust   | `EvidenceSubmitted`, `VerificationCompleted`, `TrustUpdated` | Evidence submission, AI/human review                 |
| Passport Publishing          | Passport, Version, Recruiter           | `PassportPublished`                                          | Snapshot creation, visibility config                 |
| Record + Evidence Submission | Claim, Knowledge, Evidence, AI         | `ClaimCreated`, `EvidenceSubmitted`                          | Record form, file upload, URL linking                |
| AI Resume Generation         | Resume Builder, AI, Knowledge          | `InsightGenerated`                                           | AI analysis, optimization                            |
| Recruiter Verification       | Claim, Evidence, Org, Verification     | `VerificationCompleted`                                      | Org email verification                               |
| Account Recovery             | Identity                               | None                                                         | Email-based reset                                    |

## References

- [Domain Events](domain-events.md): Events published during these workflows.
- [Domain Services](domain-services.md): Services that orchestrate these workflows.
- [Bounded Contexts](bounded-contexts.md): Contexts involved in each workflow.
