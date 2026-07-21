# Information Architecture

## Purpose

This document defines the information architecture for the Patorbit platform, mapping the sitemap, page hierarchy, and user journeys.

## Scope

This document covers sitemap, page hierarchy, and key user journeys.

---

## Sitemap

```
/                               # Marketing Home
├── /pricing                    # Pricing Plans
├── /blog                       # Public Blog
├── /docs                       # Developer Documentation

├── /login                      # Login
├── /register                   # Registration
├── /forgot-password            # Password Reset
├── /mfa                        # MFA Challenge

├── /dashboard                  # User Dashboard
│   ├── /profile                # Profile Settings
│   ├── /passport               # Career Passport
│   │   ├── /[id]               # Passport View
│   │   └── /[id]/edit          # Passport Editor
│   ├── /resumes                # Resume List
│   │   ├── /[id]               # Resume View
│   │   └── /[id]/edit          # Resume Editor
│   ├── /claims                 # Claims List
│   │   └── /[id]               # Claim Detail
│   ├── /evidence               # Evidence List
│   ├── /verifications           # Verification Status
│   ├── /settings                # Settings
│   │   ├── /profile             # Profile Settings
│   │   ├── /account             # Account Settings
│   │   ├── /billing             # Billing & Subscription
│   │   └── /notifications       # Notification Preferences
│   └── /ai-assistant            # AI Assistant

├── /recruiter                  # Recruiter Workspace
│   ├── /search                 # Candidate Search
│   ├── /candidates             # Candidate List
│   │   └── /[id]               # Candidate Profile
│   ├── /shortlists             # Saved Shortlists
│   ├── /pipelines              # Recruitment Pipelines
│   └── /settings               # Recruiter Settings

├── /organizations              # Organization Portal
│   ├── /[id]/dashboard          # Org Dashboard
│   ├── /[id]/members           # Member Management
│   ├── /[id]/verification       # Verification Queue
│   ├── /[id]/credentials        # Credential Issuance
│   └── /[id]/settings           # Organization Settings

└── /admin                      # Admin Portal
    ├── /dashboard              # Admin Dashboard
    ├── /users                  # User Management
    ├── /organizations          # Organization Management
    ├── /analytics              # Platform Analytics
    └── /settings               # Platform Settings
```

## User Journeys

### User Registration Journey

```
Marketing → Register → Verify Email → Complete Profile → Dashboard
```

### Resume Building Journey

```
Dashboard → Select Template → Add Claims → AI Optimize → Preview → Export
```

### Verification Journey

```
Passport → Add Claim → Submit Evidence → Await Verification → Status Updated
```

## References

- [Routing](routing.md): Route implementation.
- [Navigation](navigation.md): Navigation structure.
- [Application Architecture](application-architecture.md): Feature module organization.
