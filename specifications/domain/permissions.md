# Permissions and Authorization Model

## Purpose

This document defines the authorization model for the Patorbit platform. It specifies roles, permissions, ownership rules, access levels, and inheritance across bounded contexts.

## Scope

This document covers all actor roles, their permissions, data access rules, and the authorization enforcement model.

---

## Roles

The platform defines the following roles. A single Identity may hold multiple roles simultaneously.

| Role                    | Description                                  | Assignment                     | Context             |
| ----------------------- | -------------------------------------------- | ------------------------------ | ------------------- |
| **Guest**               | Unauthenticated visitor                      | Automatic                      | Identity            |
| **User**                | Registered individual                        | Automatic on registration      | Identity            |
| **Premium User**        | User with paid subscription                  | Subscription activation        | Billing             |
| **Recruiter**           | User conducting talent search                | Role grant + subscription      | Recruiter Workspace |
| **Organization Member** | Member of an organization                    | Org admin invitation           | Organizations       |
| **Organization Admin**  | Admin of an organization workspace           | Org creation or promotion      | Organizations       |
| **Verifier**            | Entity authorized to verify claims           | Certification process          | Verification        |
| **Issuer**              | Organization authorized to issue credentials | Org verification + application | Organizations       |
| **Platform Admin**      | Administrator of the entire platform         | Platform team assignment       | Administration      |

---

## Permission Matrix

### Identity and Profile

| Action                 | Guest | User | Premium | Recruiter | Org Admin | Platform Admin |
| ---------------------- | ----- | ---- | ------- | --------- | --------- | -------------- |
| Register               | ✓     | —    | —       | —         | —         | —              |
| View own profile       | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Edit own profile       | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| View public profiles   | ✓     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Set profile visibility | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Delete account         | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| View any profile       | —     | —    | —       | —         | —         | ✓              |

### Career Passport

| Action                   | Guest | User | Premium | Recruiter | Org Admin | Platform Admin |
| ------------------------ | ----- | ---- | ------- | --------- | --------- | -------------- |
| Create passport          | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| View own passport        | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Edit own passport        | —     | ✓    | ✓       | ✓         | N/A       | ✓              |
| Add claims               | —     | ✓    | ✓       | ✓         | N/A       | ✓              |
| Publish passport         | —     | ✓    | ✓       | ✓         | N/A       | ✓              |
| View published passports | —     | —    | —       | ✓         | ✓         | ✓              |
| Export passport          | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| View any passport        | —     | —    | —       | —         | —         | ✓              |

### Claims

| Action                 | Guest | User | Premium | Recruiter | Org Admin | Platform Admin |
| ---------------------- | ----- | ---- | ------- | --------- | --------- | -------------- |
| View own claims        | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Create claim           | —     | ✓    | ✓       | ✓         | N/A       | ✓              |
| Edit own claim         | —     | ✓    | ✓       | ✓         | N/A       | ✓              |
| View verified claims   | ✓     | ✓    | ✓       | ✓         | ✓         | ✓              |
| View unverified claims | —     | —    | —       | —         | —         | ✓              |
| Verify a claim         | —     | —    | —       | ✓         | ✓         | ✓              |
| Delete a claim         | —     | ✓    | ✓       | ✓         | N/A       | ✓              |

### Evidence

| Action                 | Guest | User | Premium | Recruiter | Org Admin | Platform Admin |
| ---------------------- | ----- | ---- | ------- | --------- | --------- | -------------- |
| Submit own evidence    | —     | ✓    | ✓       | ✓         | N/A       | ✓              |
| View own evidence      | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| View evidence metadata | —     | —    | —       | ✓         | ✓         | ✓              |
| Verify evidence        | —     | —    | —       | ✓         | ✓         | ✓              |
| Challenge evidence     | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Delete evidence        | —     | ✓    | ✓       | ✓         | —         | ✓              |

### Organizations

| Action                | Guest | User | Premium | Recruiter | Org Admin | Platform Admin |
| --------------------- | ----- | ---- | ------- | --------- | --------- | -------------- |
| View organizations    | ✓     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Register organization | —     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Manage organization   | —     | —    | —       | —         | ✓         | ✓              |
| Add/remove members    | —     | —    | —       | —         | ✓         | ✓              |
| Verify domain         | —     | —    | —       | —         | ✓         | ✓              |
| Issue credentials     | —     | —    | —       | —         | ✓         | ✓              |
| Revoke credentials    | —     | —    | —       | —         | ✓         | ✓              |

### Search

| Action                    | Guest | User | Premium | Recruiter | Org Admin | Platform Admin |
| ------------------------- | ----- | ---- | ------- | --------- | --------- | -------------- |
| Search passports          | ✓     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Filter by verified claims | ✓     | ✓    | ✓       | ✓         | ✓         | ✓              |
| Contact candidates        | —     | —    | —       | ✓         | ✓         | ✓              |
| Save search queries       | —     | —    | —       | ✓         | —         | ✓              |
| Export search results     | —     | —    | —       | ✓         | —         | ✓              |

---

## Ownership Rules

1. **User Data**: All Claims, Evidence, Passport, Resume data is owned by the creating Identity.
2. **Organization Data**: Workspace data, member lists, verification records are owned by the Organization.
3. **Verification Data**: Verification records are owned by the Verification context. Both the subject and verifier have read access.
4. **Knowledge Graph Data**: Nodes and edges are owned by the creating context. Read access is governed by the most restrictive owner of the constituent entities.

## Access Levels

| Level               | Description                                        | Examples                                    |
| ------------------- | -------------------------------------------------- | ------------------------------------------- |
| **Public**          | Visible to anyone, including unauthenticated users | Organization name, verified claim summaries |
| **Recruiters Only** | Visible to authenticated recruiters                | Full verified claims, skill lists           |
| **Verified Only**   | Visible to verified organizations and recruiters   | Identity verification history               |
| **Restricted**      | Visible to specific users or org members           | Internal org data, evidence details         |
| **Private**         | Visible only to owner                              | Draft claims, unverified evidence, email    |

## Inheritance

- Organization Admins inherit all permissions of Organization Members.
- Premium Users inherit all permissions of Users.
- Platform Admins have access to all data for operational purposes, audited via the Administration context.
- Recruiters gain elevated view permissions only for published (non-draft) data.

## Enforcement Model

Authorization is enforced at the bounded context boundary using the following layers:

1. **Authentication Layer**: Verifies identity and establishes session.
2. **Authorization Layer**: Checks role-based permissions for the requested action.
3. **Data Access Layer**: Applies data-level access control (row-level security for sensitive data).
4. **Audit Layer**: Logs all actions for compliance.

## References

- [Entities](entities.md): Role assignments on Identity entities.
- [Bounded Contexts](bounded-contexts.md): Context-level enforcement boundaries.
- [Workflows](workflows.md): How authorization gates specific workflows.
