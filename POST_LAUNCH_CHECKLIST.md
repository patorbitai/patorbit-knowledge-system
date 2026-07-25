# Patorbit Beta v0.9 — Post-Launch Checklist

## Overview

This checklist covers essential verification steps to perform _after_ Patorbit Beta v0.9 has been deployed to the production environment. These steps confirm that the application is healthy, accessible, and functioning as expected.

### Timeline

- **Immediate (0-15 mins):** Smoke tests and critical path verification.
- **First Hour (15-60 mins):** Performance monitoring and error log analysis.
- **First Day (1-24 hours):** User feedback monitoring and deeper feature checks.

---

## 1. Immediate Post-Deployment (0-15 mins)

### ✅ Infrastructure Health

- [ ] **Health Endpoint:** Verify `GET /health` returns `{"status":"ok"}`.
- [ ] **Database Connectivity:** Health endpoint shows `database` as up.
- [ ] **Redis Connectivity:** Health endpoint shows `redis` as up.
- [ ] **S3 Storage:** Health endpoint shows `storage` as up.

### ✅ Critical User Flows (Smoke Test)

- [ ] **Landing Page:** `https://your-domain.com` loads successfully.
- [ ] **Sign-up:** Create a new test account.
- [ ] **Email Delivery:** Receive and click the verification email.
- [ ] **Sign-in:** Log in with the new test account.
- [ ] **Resume Creation:** Create a new blank resume and verify it appears in the dashboard.
- [ ] **Admin Panel:** `https://admin.your-domain.com` loads and requires authentication.

---

## 2. First Hour (15-60 mins)

### ✅ Monitoring & Observability

- [ ] **Error Logs:** Check application logs (e.g., via Datadog, Sentry, or server logs) for any new or unusual errors since deployment.
- [ ] **API Performance:** Monitor API latency and throughput. Look for spikes or degradation.
- [ ] **Resource Usage:** Check CPU, memory, and database connection pool utilization on all services.
- [ ] **4xx/5xx Rates:** Ensure HTTP error rates are within expected ranges.

### ✅ Core Functionality Deeper Dive

- [ ] **Resume Editing:** Open a resume, make a change to a section, and verify it saves.
- [ ] **Template Switching:** Apply a different resume template and confirm the preview updates.
- [ ] **PDF Export:** Export a resume to PDF and visually inspect the output for major layout issues.
- [ ] **Workspace Organization:** Create a folder and move a resume into it.

---

## 3. First Day (1-24 hours)

### ✅ User Feedback & Support Channels

- [ ] **Feedback Forms:** Monitor incoming responses from any beta user feedback forms.
- [ ] **Support Inquiries:** Check for any new support tickets or emails related to the beta release.
- [ ] **Social Media:** Monitor relevant keywords on social media for informal feedback or bug reports.

### ✅ Advanced Feature Checks

- [ ] **AI Features:** If enabled, run a resume analysis and verify results are returned.
- [ ] **Billing Integration:** If enabled, simulate a subscription sign-up using Stripe test cards.
- [ ] **Organization Invites:** Invite a new member to an organization and verify they receive the invitation and can accept it.

### ✅ Data Integrity

- [ ] **Database:** Run a few `SELECT COUNT(*)` queries on key tables (`User`, `Resume`, `Organization`) to ensure data is being written correctly.
- [_] **Sessions:** Verify user sessions are persisting correctly across browser restarts.

---

## Emergency Rollback Trigger

A rollback should be considered if any of the following occur and cannot be resolved with a hotfix within 30 minutes:

- **Critical user flows are down** (e.g., sign-up or sign-in is broken).
- **Widespread data corruption** is detected.
- **A critical security vulnerability** is discovered post-deployment.
- **Sustained 5xx error rate** spikes above 5%.

Refer to `DEPLOYMENT_GUIDE.md` for the rollback procedure.

---

_Generated 2026-07-25 for Patorbit Beta v0.9 RC1_
