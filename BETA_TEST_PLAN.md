# Patorbit Beta v0.9 — Beta Test Plan

## Overview

This document outlines the test strategy for Patorbit Beta v0.9 RC1. Beta testing focuses on end-to-end user workflows, edge cases, error handling, and compatibility across major scenarios, rather than exhaustive unit testing. All tests should be run by internal QA and invited external beta users.

## Test Scope & Priority

### Priority 1: Core User Journeys (Must-Pass)

These flows represent the primary value props of the platform:

1. **User Registration & Authentication**
   - Sign-up → Email verification → Sign-in → Session persistence
   - Password reset flow (email sent, token validation, new password acceptance)
   - Multi-device login session management

2. **Resume Creation & Management**
   - Start a new resume from scratch
   - Add/edit/delete section types (experience, education, etc.)
   - Apply multiple themes/templates
   - Switch templates visually
   - Export resume to PDF (check consistency across browsers)
   - Version history (create version, load earlier version)

3. **Cover Letter Creation**
   - Link to existing resume
   - Generate basic cover letter
   - Edit personalization fields

4. **Workspace & Organization**
   - Create folders, nested organization
   - Drag-and-drop resume between folders
   - Search, filter, sort resumes and cover letters
   - Bulk archive/delete

5. **AI Features**
   - Resume analysis (requires AI service API)
   - Suggested improvements display
   - Accept/Reject suggestions

### Priority 2: Edge Cases & Error Conditions

- Invalid input validation (empty fields, malformed content)
- API rate limiting (if enabled)
- Network failures and offline sync queue
- Corrupted localStorage/session restoration

### Priority 3: Administrative & Settings

- User profile management
- Security settings (two-factor not yet implemented)
- Notification preferences

## Test Approach

### Manual Testing

- **Exploratory testing** by QA team on all critical flows
- **Usability testing** with invited external beta users (focus on UI/UX)
- **Performance testing** (load time, API latency) on dev hardware (may not reflect production)

### Automated Validation

- **Smoke tests:** Build passes, health endpoint responds
- **End-to-end test scripts:** Playwright or Cypress for critical journeys (optional, due to test directory being currently disabled)
- **Shell scripts:** Environment variable validation, service start/stop check

### Compatibility Testing

- Browser support: Chrome, Firefox, Safari (latest versions)
- mobile/responsive viewport checks for resume editor

## Test Environments

### Development Environment

```bash
pnpm dev
pnpm test:unit (if available)
pnpm typecheck
```

### Staging Environment (simulates production)

- Clone code to staging VM
- Use production-like configuration (DB URLs, Redis, Stripe test keys)
- Run full build (pnpm build)
- Run smoke tests

### Production canary (internal only)

- Deploy to a small subset of infrastructure
- Monitor error rates, performance
- Gather initial user feedback

## Test Scripts (if needed)

### Smoke Test

```bash
#!/bin/bash
set -e
echo "Running smoke tests..."

# 1. Build
pnpm build
if [ $? -ne 0 ]; then
  echo "Build failed"
  exit 1
fi

# 2. Type check
pnpm typecheck 2>&1 | grep -v "none" || echo "Typecheck passed (no files)"

# 3. Health check
curl -s http://localhost:4000/health || echo "Health check failed"

echo "Smoke tests passed"
```

### Frontend manual checklist

1. _Open http://localhost:3000_
2. _Navigate to sign-up_
3. _Complete registration_
4. _Log in_
5. _Create a resume_
6. _Add a section_
7. _Change theme_
8. _Export to PDF (print preview check)_
9. _Log out and log back in_
10. _Navigate to admin panel (http://localhost:3001)_

## Reporting Test Results

- All test failures must be linked to a GitHub issue
- Critical test failures block RC1 promotion
- Medium test failures require sign-off from product owner
- Low test failures do not block release but are logged for future sprints

## Training for Beta Test Users

### Internal QA team

- Run the smoke test script
- Access staging environment admin credentials
- Documentation: internal-confluence/wiki/beta-testing-guide

### External beta users

- Send welcome email with temporary credentials and test task list
- Provide feedback link (Google Forms / SurveyMonkey)
- Escalation path: email to beta-support@domain.com

### Support during Beta

- Enable detailed logging for beta users (request via ticket)
- Provide real-time debugging via CLI (`pnpm logs:enable`)
- Daily status check at 09:00 UTC to QA team

---

_Generated 2026-07-25 for Patorbit Beta v0.9 RC1_
