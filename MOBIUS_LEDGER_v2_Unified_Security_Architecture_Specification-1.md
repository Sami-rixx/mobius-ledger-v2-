# MÖBIUS LEDGER v2 — Unified Security Architecture Specification

**Version:** 1.0  
**Date:** 2026-10-05  
**Status:** Proposed implementation baseline  

Synthesized from the independent Claude and Kimi repository security reviews. Owner decisions are explicitly marked and are not silently converted into business policy.

## 0. Purpose and Authority

This specification reconciles the independent Claude and Kimi security architecture reviews of MÖBIUS LEDGER v2. It is the proposed implementation baseline for Arena AI after the project owner approves the explicitly marked owner decisions.

Classification: VERIFIED FACT = supported by repository inspection; SECURITY REQUIREMENT = mandatory target control; ARCHITECTURAL DECISION = unified design choice; OWNER DECISION = requires explicit approval; IMPLEMENTATION TASK = concrete engineering work; FUTURE HARDENING = valuable but not a production blocker.

## 1. Executive Security Decision

MÖBIUS LEDGER v2 should remain a single-school, persistent SQLite application using the existing route → controller → service → model architecture. Security should be added as an enforcement layer, not by rewriting the financial domain.

The dominant current defect is the absence of an API security perimeter. The repository contains RBAC/session data structures, but they are not functioning as an authentication or authorization boundary. The target model is: authenticated server-side session → trusted req.user → route-level RBAC → service-level financial separation-of-duties → server-only audit events → transactional financial writes → SQLite integrity controls → tested backups and CI security gates.

Production-readiness rule: the system is not production-ready for multi-user or internet-facing deployment until all P0 controls and the mandatory security acceptance suite are green.

## 2. Verified Current-State Findings

Authentication/authorization: no functioning login/authentication boundary or route authorization was found. Financial, student, audit, session-management and administrative endpoints are therefore reachable without credentials.

RBAC: users, user_sessions, roles, permissions, user_roles and role_permissions exist, but the data model is inert until middleware and service enforcement are added.

Actor identity: client-controlled x-user-id patterns and fallback identities such as req.user?.id || 1 are unsafe. The authenticated session must become the only trusted application-level actor source.

Audit: client-callable audit creation/deletion endpoints exist, and the reports found financial flows are not consistently wired to a server-only audit event path.

Import/restore: database import/export/restore is a critical administrative surface. The reviewed design can execute SQL through db.exec() and accepts unsafe path inputs.

ORDER BY injection: multiple list models interpolate orderBy/orderDir into SQL. Every sortable field and direction must be allowlisted.

Money cents: amount_cents exists in schema but is not consistently written by real application paths. A half-migrated dual-unit model is an integrity defect.

Idempotency: financial POST operations lack duplicate-submission protection. This is elevated to P0 because the application is a financial ledger and may operate over unreliable/mobile connectivity.

## 3. Security Principles

Fail closed. Authenticate before authorizing. Authorize at the API boundary, not only in the UI. Never trust client-supplied actor identity. Financial mutations must be transactional. Audit events are server-generated evidence. Posted financial history should be corrected by reversal rather than casual deletion. SQL identifiers must be allowlisted. Least privilege is mandatory. Security tests belong in Gatechecker. Existing CI checks must not be weakened.

## 4. Authentication Architecture

ARCHITECTURAL DECISION — recommended: server-side sessions using the existing user_sessions table, rather than JWT.

Password storage: Argon2id is preferred. bcrypt cost >=12 is an acceptable fallback if native-build constraints make Argon2id impractical. Plaintext passwords are prohibited. NULL password hashes must not permit login.

Endpoints: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, POST /api/auth/change-password. Only login and health/readiness endpoints are public.

Session token model: generate at least 32 cryptographically secure random bytes; send the raw token only in a secure cookie; store only a SHA-256 token hash; never return raw tokens; revoke on logout; disabled users must lose session access.

Cookie target: HttpOnly, Secure in production, SameSite=Lax, narrow Path, never localStorage/sessionStorage, never URL/query string.

OWNER-APPROVED SESSION POLICY: 8-hour idle timeout, 24-hour sliding lifetime, 7-day absolute lifetime, up to five concurrently active sessions per user.

Bootstrap: the seeded/system administrative identity must not remain a usable NULL-password account. Provide a controlled first-run bootstrap mechanism that forces a real password.

## 5. Authorization and RBAC

Implement authenticate and requirePermission(permissionName) middleware. authenticate validates the session, loads an active user, sets trusted req.user and returns 401 for missing/invalid/expired/disabled sessions. requirePermission returns 403 when the authenticated user lacks the required permission.

Route-level authorization is mandatory. High-risk rules must also exist in services.

Forbidden patterns: x-user-id as actor identity; req.user?.id || 1 as an authorization fallback; UI-only authorization; client-supplied role/permission claims; body user_id used as the authenticated actor.

OWNER-APPROVED ROLE MODEL: Admin, Director, Finance Officer, Clerk, Auditor, Viewer.

Suggested permission namespace: students.read/create/update/delete; classes.read; fees.read/create/update; charges.read/create/update; income.read/create/update/delete; expenses.read/create/update/delete; withdrawals.read/create/approve/reject; transactions.read/create/update; reports.read/export; audit.read; users.manage; roles.manage; sessions.manage; import.export; database.restore; settings.manage.

High-risk defaults: users/roles/session administration = Admin; database restore = Admin with maker-checker; withdrawal approval/rejection = Director/Admin; audit write/delete = internal-only; full database export = Admin unless explicitly expanded.

## 6. Financial Separation of Duties

Withdrawal maker-checker is mandatory: the creator of a withdrawal can never approve or reject that same withdrawal. Enforce in the service layer, not just the route.

Withdrawal approval must be one transaction: validate status, permission and maker-checker; transition status; create/update linked transaction; update dependent ledger state; write audit event. Any failure rolls back the entire operation.

OWNER DECISION — EXPENSE APPROVAL: No new expense-approval workflow is to be introduced in this security implementation. Do not invent approval thresholds or categories.

POSTED-RECORD DELETION — OWNER DECISION PENDING: The owner requested an explanation of the trade-off before choosing between strict reversal/correction-only treatment and allowing limited deletion of selected records. Until that decision is made, Arena must not invent a broader deletion policy. It must preserve existing domain behavior where necessary, while closing clearly unsafe destructive endpoints and documenting every remaining financial-delete path for the decision gate.

## 7. Audit Architecture

Create one internal audit service/event writer. Audit actors must come from req.user. Clients must never fabricate audit events.

Expand audit taxonomy to include LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, PASSWORD_CHANGE, ROLE_ASSIGNED, ROLE_REVOKED, PERMISSION_CHANGED, CREATE, UPDATE, REVERSAL, WITHDRAWAL_APPROVED, WITHDRAWAL_REJECTED, EXPORT, IMPORT, RESTORE, AUTHZ_DENIED and SESSION_REVOKED.

Remove externally callable raw audit POST, financial-audit logging POST and audit DELETE endpoints. Audit retrieval may remain read-only and permission-gated.

Add SQLite triggers that reject UPDATE and DELETE against audit_trail as defense in depth.

AUDIT TAMPER PROTECTION — OWNER DECISION PENDING: The owner requested an explanation before deciding whether to add hash-chain audit rows now or defer them. The implementation baseline is server-only audit writes plus SQLite UPDATE/DELETE protection. Arena must not silently introduce a hash-chain format that becomes a new compatibility obligation; prepare the audit architecture so a later hash chain/checkpoint layer can be added cleanly.

## 8. Import, Export and Restore

Full database export must be authenticated, permission-gated and audited.

Do not execute arbitrary SQL supplied by an HTTP client. Preferred import model: controlled staging → schema/version validation → field/row validation → dry run → privileged execution → audit.

Restore must use server-controlled backup identifiers, reject traversal, never accept arbitrary filesystem paths, require Admin permission, preferably require maker-checker, create a pre-restore backup, audit the operation and verify integrity after restore.

db:seed must refuse to run under NODE_ENV=production because the reviewed seed process can wipe financial/audit data.

## 9. API and Input Security

ORDER BY injection is P0. Create a shared parseOrder/allowlist utility. Each endpoint defines hardcoded symbolic sort keys and directions. Unknown values return 400. No user-supplied SQL fragment may be interpolated.

Bound pagination. Recommended maximum page size: 100. Validate page, pageSize, sort, IDs, enums, dates and monetary values.

Do not expose raw SQLite constraint messages or SQL internals in production responses. Map them to safe domain errors while preserving diagnostics in server logs.

Adopt one consistent request-validation strategy such as Zod or express-validator.

## 10. Browser Security, CSRF and CORS

Cookie authentication requires CSRF protection. Preferred deployment is same-origin frontend/backend, narrow CORS, credentials only for the intended frontend, and an explicit CSRF token/custom-header mechanism on state-changing requests.

Keep React's default escaping. Avoid dangerouslySetInnerHTML. Add/verify HSTS, CSP, Referrer-Policy and appropriate content/framing protections at the reverse proxy/application boundary.

## 11. Money Model and Idempotency

OWNER-APPROVED MONEY MODEL: Finish the cents migration. Write amount_cents on every relevant financial path, migrate calculations where appropriate, backfill/verify historical data and add consistency checks. Leaving both monetary representations half-active is prohibited.

Daily-ledger integrity must have one explicit invariant. Recommended: posted monetary amounts are immutable and corrections are reversals. If updates remain supported, all dependent ledger state must be maintained transactionally.

Idempotency-Key is P0 for money-moving POSTs: income, expense, fee payment, withdrawal, transaction and any other financial create route identified during route inventory. Replays with the same key must not create duplicate financial records.

## 12. SQLite and Persistence

SQLITE REMAINS APPROPRIATE for the current single-school deployment. Retain one persistent database, WAL/foreign keys as appropriate, restricted file permissions and explicit transactions for multi-step financial writes.

HOSTING — OWNER DECISION PENDING: The owner requested an explanation before choosing the production hosting model. The security specification therefore defines a persistent-storage requirement but does not authorize Arena to select a VPS, managed VM, container platform or other hosting provider. Arena must keep deployment assumptions portable and document the hosting requirements and trade-offs for the owner decision.

Do not deploy this architecture as an ephemeral/serverless multi-instance system without redesigning persistence.

Introduce numbered migrations and a schema_migrations mechanism. CREATE TABLE IF NOT EXISTS is not a sufficient long-term schema-evolution strategy.

## 13. Deployment and Backups

Recommended deployment: persistent VPS/VM, nginx or equivalent reverse proxy, TLS, backend bound to localhost, preferably one origin, service user, restricted DB permissions, firewall and routine OS updates.

Until P0 authentication/authorization lands, the application must not be internet-facing; use VPN/IP allowlisting/local-only access.

Backups: hourly during school hours, daily, weekly retention; encrypted; at least two off-host destinations; at least one immutable/append-only copy; documented retention; restore drill at least monthly once operational.

Minimum restore acceptance: real restore executed, PRAGMA integrity_check passes, application boots against restored DB, key row counts and financial totals are verified. Suggested targets: RPO <=1 hour during school operating hours and RTO <=4 hours.

## 14. Frontend Architecture

Add login, auth state/context, /api/auth/me bootstrap, protected-route UX and logout. Permission-aware navigation may hide unavailable functions.

Frontend guards are UX only. Backend authorization is the security boundary and must be tested independently.

## 15. Security Test Architecture

Layer 1 unit tests: password hashing, token hashing, permission resolution, session expiry/revocation, maker-checker, order parser, cents consistency and idempotency.

Layer 2 authorization matrix: every protected route × role. No cookie = 401; wrong permission = 403; correct permission = normal result; disabled user = 401; expired/revoked session = 401.

Mandatory probes: self-approval = 403; finance officer without approval permission = 403; distinct authorized approver succeeds; audit delete endpoint removed/blocked; raw session-token lookup removed/blocked; clerk export = 403; malicious orderBy/orderDir = 400; login failure = 401 and audited; repeated financial POST with same idempotency key creates one logical record.

Layer 3 end-to-end story: User A logs in → creates withdrawal → self-approval rejected → User B approves → exactly one transaction and ledger update → both actions appear with correct actors → audit deletion/fabrication fails.

Security tests must be part of the existing Jest/Vitest/Gatechecker flow.

## 16. CI and Gatechecker

Do not weaken existing build, test or lint checks.

Add mandatory authentication/authorization, privilege-escalation, self-approval, import/export, SQL injection, session, audit and idempotency tests.

Add dependency auditing at high severity, a route-protection static check, production-seed safety check and secret scanning where practical. Add SAST as a later hardening gate.

Gatechecker success means the security behavior is verified, not merely that the application compiles.

## 17. Arena Implementation Phases

Phase 0 — baseline freeze: confirm branch/HEAD, route inventory, financial mutation inventory, actor identity inventory, ORDER BY inventory, import/restore inventory, audit write inventory, money-path inventory and Gatechecker commands. STOP if repository reality materially differs.

Phase 1 — authentication foundation: password hashing, login/logout/me/change-password, secure sessions, token hashing, expiry/revocation, bootstrap admin and tests.

Phase 2 — global authentication: protect every API route except explicitly public health/readiness and login; ship frontend login/session bootstrap. Acceptance: protected endpoints return 401 without a session.

Phase 3 — RBAC: permission resolution, role seeding, route middleware, service-level high-risk checks and user/role administration. Acceptance: complete route × role matrix passes.

Phase 4 — high-risk closure: remove x-user-id and identity fallbacks; remove raw session-token lookup; remove client audit writes/deletes; secure import/export/restore; enforce withdrawal maker-checker; make approval atomic; fix ORDER BY injection.

Phase 5 — financial integrity: execute owner-approved cents decision; implement idempotency; transaction boundaries; reversal policy; CSV staging/validation; consistency checks.

Phase 6 — operations: migration runner, production seed guard, encrypted/off-site backups, restore drill, deployment hardening and configuration validation.

Phase 7 — final security Gatechecker: backend tests, frontend tests, build, lint, security matrix, injection probes, idempotency, audit tests, dependency audit and production-safety checks.

## 18. Production Acceptance Checklist

Every protected API endpoint requires a valid session.

Login/logout/me/change-password work and are tested.

Passwords are securely hashed; NULL-password accounts cannot log in.

Session tokens are hashed at rest; cookie flags are correct; expiry/revocation work.

Every protected route has explicit permission enforcement.

x-user-id and security-sensitive req.user?.id || 1 fallbacks are absent.

Withdrawal maker-checker is enforced in the service layer.

Posted financial records cannot be casually hard-deleted.

Audit events are server-generated and audit mutation is blocked.

Import/export/restore are permission-gated and restore cannot accept arbitrary paths.

Production seed is blocked.

ORDER BY/orderDir injection probes pass.

Raw SQLite/SQL errors are not exposed in production responses.

Multi-step financial writes are transactional.

Idempotency protects financial POST retries.

Cents migration is complete or formally removed.

Daily ledger remains consistent.

Backups are encrypted and off-host.

At least one real restore drill succeeds.

Gatechecker includes the security suite and is fully green.

## 18A. Owner Decision Briefs — Three Items Still Pending

### A. Posted financial records: hard delete vs reversal/correction

**Option 1 — reversal/correction only (strongest financial-control model):** Once a financial record is posted, it is never physically deleted. Errors are corrected with a compensating reversal/correction transaction that preserves the original record and audit history. **Benefits:** strongest traceability, easier reconciliation, clearer audit evidence, lower fraud risk. **Costs:** more records, more complex correction UX, and users must understand reversal semantics.

**Option 2 — limited deletion:** permit hard deletion only for narrowly defined pre-posting/draft records or explicitly low-risk records, while posted/settled financial records remain immutable. **Benefits:** simpler cleanup for genuine data-entry mistakes. **Costs:** more policy complexity, greater risk of accidental or malicious destruction, and harder audit/reconciliation behavior.

**Recommended direction:** Option 1 for posted financial records, with narrowly scoped deletion only where the domain can prove the record is still a draft/unposted object. The owner has not yet approved this policy; Arena must not choose it silently.

### B. Audit hash chain: now vs later

**Option 1 — hash chain now:** each audit event cryptographically commits to the previous event, making tampering substantially more detectable. **Benefits:** stronger forensic integrity and better evidence if the database itself is compromised. **Costs:** schema/protocol complexity, migration and recovery considerations, canonicalization requirements, and a new compatibility surface.

**Option 2 — defer hash chain:** enforce server-only audit writes plus SQLite triggers that reject UPDATE/DELETE now, then add hash chaining or signed off-host checkpoints as a later hardening phase. **Benefits:** faster closure of the current client-writable/deletable audit defect and lower implementation complexity. **Costs:** less protection against a privileged/database-level attacker until the later phase.

**Recommended direction:** Option 2 for the current production-readiness push, because the immediate defect is unauthorized mutation of audit records. The owner has not yet approved the timing decision.

### C. Hosting: persistent VPS/VM vs alternatives

**Option 1 — persistent single VPS/VM:** best fit for SQLite because the database remains on durable local storage and the application can run as one controlled instance behind a reverse proxy. **Benefits:** simple operations, predictable filesystem semantics, straightforward backups, low cost. **Costs:** server maintenance, single-host availability risk, and responsibility for hardening/patching.

**Option 2 — managed/container platform with persistent volume:** can improve deployment automation and operational tooling, but SQLite still requires durable storage and careful single-writer/multi-instance behavior. **Benefits:** easier deployment/observability in some environments. **Costs:** more platform complexity and greater risk of accidentally using ephemeral storage or multiple application instances.

**Option 3 — serverless/ephemeral multi-instance:** not appropriate without redesigning the persistence architecture.

**Recommended direction:** persistent single VPS/VM for the current single-school SQLite architecture. The owner has not yet approved the hosting choice, so Arena must keep deployment guidance provider-neutral until the decision is made.

## 19. Owner Decision Register

D1 — Auth model: SERVER-SIDE SESSION COOKIE — owner approved.

D2 — Password hashing: ARGON2ID — owner approved. bcrypt >=12 remains an implementation fallback only if the actual environment makes Argon2id impractical.

D3 — Session lifetime: 8h idle / 24h sliding / 7d absolute — owner approved.

D4 — Concurrent sessions: allowed, with a maximum of 5 active sessions per user — owner approved.

D5 — Roles: Admin, Director, Finance Officer, Clerk, Auditor, Viewer — owner approved.

D6 — Withdrawal approval: Director/Admin; never self-approve — owner approved.

D7 — Expense approval: NO new workflow in this implementation — owner approved.

D8 — Cents: FINISH MIGRATION — owner approved.

D9 — Financial idempotency: P0 — owner approved.

D10 — Posted financial deletion: OWNER DECISION PENDING after trade-off briefing. Do not silently choose a broader deletion policy.

D11 — Hosting: OWNER DECISION PENDING after trade-off briefing. Keep deployment guidance provider-neutral and require persistent durable storage.

D12 — Backups: encrypted + off-site + immutable copy, with the approved backup cadence/restore-drill requirements — owner approved.

D13 — Audit hash chain: OWNER DECISION PENDING after trade-off briefing. Server-only audit writes + SQLite UPDATE/DELETE protection are the approved baseline now.

D14 — Production restore: Admin + maker-checker — owner approved as the target control.

Approved decisions in this register are implementation authority. The three unresolved owner decisions (posted-record deletion policy, audit hash-chain timing, and hosting model) remain explicit decision gates. Arena must not silently choose among those options. Security controls that close verified critical vulnerabilities must still be implemented, but business-policy choices must remain within the approved boundary.

## 20. Source Reconciliation

Claude independently identified the missing API security perimeter, inert RBAC, unsafe actor attribution, audit mutation exposure, import/restore risks, incomplete cents runtime integration, withdrawal maker-checker, cookie-session architecture and production-readiness requirements.

Kimi independently identified the same core perimeter defects and additionally emphasized exposed session-token endpoints, ORDER BY injection, unsafe import/restore behavior, incomplete amount_cents writes, idempotency, migration-runner needs, production seed safety, backup/restore controls and a more detailed security test matrix.

Unified resolution: treat direct attack surfaces and financial-integrity controls as P0; keep business-policy choices explicit as owner decisions; preserve the existing architecture and Gatechecker; implement in reviewable phases.

## 21. Final Rule for Arena

Arena must treat this document as an implementation specification, not permission to redesign the product.

Arena may add security middleware, authentication/session services, RBAC enforcement, migrations, validation, security tests, safe SQL ordering, import/export hardening, audit wiring, transactional financial writes, idempotency, frontend login/guards and deployment safeguards.

Arena must not silently replace SQLite, redesign the financial domain, invent roles, change approval policy, delete historical data, weaken Gatechecker, remove tests to obtain green CI, or change the authentication paradigm without owner approval.

Definition of done: the code, tests, database invariants, frontend behavior, deployment posture and Gatechecker all enforce the same security model. A green unit suite without an enforced security perimeter is not production readiness.

## Source basis

- Kimi: *MÖBIUS LEDGER v2 — Security Architecture Review & Design* (2026-10-05).
- Claude: *MÖBIUS LEDGER v2 — Independent Security Architecture Review* (2026-10-05).
- External technical reference used only to validate the SQLite transaction principle: SQLite documentation on transactional atomicity.
