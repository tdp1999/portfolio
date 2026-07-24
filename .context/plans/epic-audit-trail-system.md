# Epic: Audit Trail System (Console)

## Summary

A reusable, "correct and defensible" audit trail for the console/admin surface: an append-only
record of **who did what, when, from where, and with what result** across every admin mutation and
every authentication event. The design leans on an architectural gift already present in the
codebase (`BaseCommand{ userId, timestamp }` flowing through `CommandBus`) so the common path is
captured automatically with near-zero per-handler boilerplate, while a small explicit API covers the
cases interceptors cannot see (auth events, precise before/after state). Backed by research in
`.context/learning/audit-trail-system.md`.

## Why

The console can create, edit, delete, restore, and reorder every piece of portfolio content, plus
manage users and auth. Today the only trace is row-level `createdBy/updatedBy/deletedBy` columns on
each entity, which answer "who touched this row last" but not "what was the full history, what
changed, who logged in, what failed." That is a blind spot for:

- **Accountability / non-repudiation:** proving an action happened and who did it.
- **Incident forensics:** reconstructing a timeline after a mistake or a suspicious change.
- **Trust:** a single-admin system today, but the pattern must hold if a second operator/auditor is
  ever added.

The goal is the research-backed **minimum viable, defensible** bar (NIST AU-3 schema + ISO "a user
cannot edit their own trail" + OWASP never-log rules), not a gold-plated enterprise/SIEM build.

## Target Users

- **Admin/operator** (primary actor being recorded): sees a per-entity history/timeline on detail pages.
- **Auditor / the admin acting in a review capacity:** browses, filters, and inspects the audit log.
- **Future second operator:** the segregation-of-duties design means one operator cannot silently
  erase the trail of their own actions.

## Scope

### In Scope (v1)

- **Capture** every admin **mutation** routed through `CommandBus` (create / update / delete /
  restore / reorder) across all console domains, automatically.
- **Capture** **auth events** that do not flow through `CommandBus` in the usual way: `login.succeeded`,
  `login.failed`, `logout`, `logout.all`, `password.changed`, `password.reset`, `token.refreshed`.
- A single **`AuditEvent`** Prisma model (append-only) holding the canonical 5W+H schema.
- **Hybrid capture:** (1) an auto `CommandBus` audit interceptor, plus (2) an explicit
  `AuditService.record()` API for enrichment (before/after) and non-command events.
- **Append-only integrity:** no update/delete methods in the repository + a migration that
  `REVOKE UPDATE, DELETE` on the table from the app DB role.
- **Redaction:** secrets never logged; PII masked at write time.
- **Read API:** list/filter (actor, resource type+id, date range, action, outcome) + per-resource
  timeline.
- **Access control:** audit-read gated behind an explicit guard (ADMIN in v1; `AUDITOR` role as an
  additive option); the app DB role holds only `INSERT` on the table.
- **Console UI:** an Audit Log page (searchable/filterable table + before/after diff viewer) and a
  reusable per-resource timeline component for entity detail pages.

### Out of Scope (v1, deferred)

- **Cryptographic tamper-evidence** (hash-chaining, per-record signatures, Merkle trees, external
  anchoring) — `record_hash`/`prev_hash`/`signature`/`sequence_number` fields are intentionally left
  out until a real driver exists.
- **WORM / immutable object storage** and legal-hold archival.
- **Fail-closed writes** (blocking the business transaction on audit-write failure). v1 is fail-open.
- **Sensitive-read auditing** (logging views/exports of contact-message / user data). Deferred to v2.
- **Automated alerting / anomaly rules** (failed-login bursts, off-hours admin actions) and any SIEM.
- **Table partitioning / hot-cold archival.** v1 is a single flat table; partitioning is a later
  scaling concern, not a correctness one.
- **DB-trigger or CDC capture.** Application-layer only in v1.

## High-Level Requirements

1. Every admin mutation through `CommandBus` produces exactly one `AuditEvent` recording actor,
   action, target resource, outcome, timestamp (UTC), and request context — with no code change
   required in the individual command handlers.
2. Each captured auth event produces an `AuditEvent` with the correct actor (or attempted-actor for
   failed login) and outcome.
3. `AuditEvent` rows can never be updated or deleted through the application; this is enforced both at
   the repository (no such methods exist) and at the database (grants revoked).
4. No secret (password, token, key) is ever written into an audit record; configured PII fields are
   masked/redacted at write time.
5. An audit-write failure logs an internal error but never fails or rolls back the originating
   business operation (fail-open).
6. Failed commands (handler throws) are still recorded with `outcome = failure` and an error code.
7. The audit read API supports filtering by actor, resource type + id, date range, action, and
   outcome, and returns a per-resource timeline ordered newest-first with keyset pagination.
8. Audit read is denied to unauthorized roles and (target for v1) reading the audit log is itself
   recorded as an `audit.viewed` event.
9. The console exposes an Audit Log page and a reusable per-resource timeline; the diff viewer keeps
   masked fields masked at render time.
10. Action names follow the `resource.action` past-tense controlled vocabulary; every console domain
    maps to a stable `resourceType`.

## Technical Considerations

### Architecture

Fits the existing NestJS DDD + `@nestjs/cqrs` structure. New cross-cutting concern lives in a
dedicated module `apps/api/src/modules/audit/` with the standard
`presentation / application / domain / infrastructure` layers, plus small shared wiring in
`apps/api/src/shared/`.

**Capture flow (hybrid):**

```
Controller (presentation)
  │  req.user + req.ip + req.headers['user-agent'] + correlationId
  ▼
RequestContext (request-scoped provider)  ── captures WHERE/WHO-context once per request
  │
  ▼
CommandBus.execute(command extends BaseCommand{ userId, timestamp })
  │
  ├─►  AuditCommandInterceptor  ── AUTO: on success/error, resolves command→{action,resourceType}
  │        via an Action Registry, reads RequestContext, writes one AuditEvent (fail-open).
  │
  └─►  Handler (application)     ── OPTIONAL: calls AuditService.record({ before, after, reason })
           for sensitive ops needing precise field-level diff, or emits events that never hit
           CommandBus (auth login/logout live in guards/services → explicit record()).
                     │
                     ▼
             AuditService → AuditRepository.insert()  (INSERT-only; separate from business tx)
                     ▼
                 audit_events  (append-only Postgres table)
```

- **Interceptor vs explicit split:** the interceptor gives who/what/when/outcome/input for *every*
  command for free (because `BaseCommand` already standardizes `userId`+`timestamp`). Explicit
  `record()` is the escape hatch for (a) `before`/`after` diffs that require the handler's loaded
  entity, and (b) events with no command (auth). This is the hybrid the user approved.
- **Action Registry:** a single map from command class → `{ action, resourceType, category }` (e.g.
  `UpdateProjectCommand → { action: 'project.updated', resourceType: 'project', category: 'content' }`).
  Keeps taxonomy centralized and lets the interceptor stay generic. A command absent from the registry
  is either skipped or logged as `unknown` (decide in Stream B; default: skip + dev-warn so new
  commands are noticed).
- **Delivery = fail-open, out-of-band:** audit write happens after the handler resolves (or rejects),
  on a path whose failure is caught and logged, never propagated. This trades the "record survives
  even if business tx rolls back" property away in the simplest direction; acceptable for an internal
  console (documented, not implicit). Outbox/same-transaction is a v2 lever if durability needs rise.
- **No errors in controllers** stays intact: controllers only feed `RequestContext`; all audit logic
  is in the interceptor / application layer.

### Dependencies

- Existing `JwtAccessGuard` (supplies `req.user`), `RoleGuard`/`@Roles`, `BaseCommand`, `CommandBus`.
- Existing error dictionary (`@portfolio/shared/errors`) for `outcome=failure` error codes.
- Prisma + a migration; uses `prisma-migrate` skill (schema change).
- Console: existing shared console table/filter primitives, Material, `ui-*` shared components.

### Data Model

New model, matching existing conventions (UUID string id, `@@map` snake_case, UTC `DateTime`):

```prisma
enum AuditActorType {
  USER      // authenticated human/admin
  SYSTEM    // background job / seed / migration
  API_KEY   // future: machine integration
}

enum AuditOutcome {
  SUCCESS
  FAILURE
}

enum AuditCategory {
  CONTENT   // project/skill/experience/blog/etc mutations
  AUTH      // login/logout/password/token
  ADMIN     // user/role/settings changes
  ACCESS    // (v2) sensitive reads/exports
}

model AuditEvent {
  id               String         @id @db.Uuid
  occurredAt       DateTime       @default(now())          // UTC, server-generated
  actorType        AuditActorType @default(USER)
  actorId          String?        @db.Uuid                 // null for anonymous/failed-login-unknown
  actorDisplayName String?                                 // name snapshot at event time
  action           String                                  // 'project.updated' (resource.action)
  category         AuditCategory
  outcome          AuditOutcome   @default(SUCCESS)
  errorCode        String?                                 // populated when outcome = FAILURE
  resourceType     String                                  // 'project', 'user', 'session', ...
  resourceId       String?                                 // null for collection/auth events
  resourceName     String?                                 // label snapshot at event time
  sourceIp         String?
  userAgent        String?
  correlationId    String?        @db.Uuid                 // groups multi-row / multi-service actions
  environment      String?                                 // prod/staging/dev
  beforeState      Json?          @db.JsonB                // prior values (mutations)
  afterState       Json?          @db.JsonB                // new values (mutations)
  changedFields    String[]                                // explicit diff key list
  reason           String?                                 // justification for sensitive actions
  metadata         Json?          @db.JsonB                // free-form extras

  @@index([resourceType, resourceId, occurredAt(sort: Desc)])
  @@index([actorId, occurredAt(sort: Desc)])
  @@index([action, occurredAt(sort: Desc)])
  @@map("audit_events")
}
```

Notes:
- No FK from `actorId` to `users.id`: audit records must **survive user deletion** and must not be
  cascade-affected. Actor name is snapshotted into `actorDisplayName`. (This is deliberate; do not
  "fix" it into a relation.)
- Intentionally omitted v1 fields (for future integrity work): `recordHash`, `prevHash`, `signature`,
  `sequenceNumber`.
- `changedFields String[]` uses Postgres array; `beforeState`/`afterState` are `JsonB`.

### Event Taxonomy (`resource.action`, past tense, controlled vocab)

| resourceType | actions |
|---|---|
| project / skill / experience / category / tag / blog-post / profile / about-principle / about-failure / email-template / media | `<r>.created`, `<r>.updated`, `<r>.deleted`, `<r>.restored`, `<r>.reordered` (where applicable) |
| contact-message | `contact-message.updated` (status change), `contact-message.deleted` |
| user | `user.created`, `user.updated`, `user.deleted`, `user.role_changed`, `user.invited` |
| session (auth) | `session.login_succeeded`, `session.login_failed`, `session.logged_out`, `session.logged_out_all`, `session.token_refreshed` |
| credential (auth) | `credential.password_changed`, `credential.password_reset`, `credential.password_set` |
| audit | `audit.viewed` (self-audit of reads) |

Verb vocab is a small closed set (`created/updated/deleted/restored/reordered/…`); free-form verbs are
banned to keep the stream filterable.

## Risks & Warnings

⚠️ **Silent coverage gaps (the #1 audit failure mode)**
- Any write path that does **not** go through `CommandBus` (direct Prisma in a service, seed scripts,
  a future background job, CSV import) escapes the interceptor.
- Mitigation: route mutations through commands as the norm; use explicit `AuditService.record()` for
  the known exceptions (auth); add a dev-time warning when a command hits the bus without an Action
  Registry entry so new gaps surface immediately.

⚠️ **PII / secret leakage into the audit table**
- `beforeState`/`afterState` on `user`/`credential`/`profile` mutations can accidentally capture
  password hashes, tokens, emails, phone numbers.
- Mitigation: a central redaction pass with a per-resource field denylist (never log) + PII masklist
  (mask) applied before insert; a contract test asserts denylisted fields never appear. Reuse/extend
  whatever masking the RTE/error pipeline already does rather than inventing a parallel one.

⚠️ **Append-only is only as strong as its weakest grant**
- Revoking `UPDATE/DELETE` from the app role does **not** stop the table owner / superuser / a
  migration. That gap is acceptable at this tier but must be **documented, not pretended away**.
- Mitigation: repository exposes insert+read only; migration revokes app-role UPDATE/DELETE; note the
  owner-bypass caveat in the module README and `decisions.md`.

⚠️ **Fail-open means audit loss is possible**
- If the audit write throws (DB blip), the business action still succeeds and that event is lost.
- Mitigation: catch+log audit-write failures to the app logger (so a broken pipeline is visible);
  optionally emit a health signal if audit-write error rate spikes. Accept the trade-off explicitly
  for v1; outbox is the v2 upgrade path.

⚠️ **Interceptor ordering / request-scope cost**
- The interceptor must run around `CommandBus` handlers and read a **request-scoped** context; getting
  scope/DI wiring wrong yields null actor/IP or a perf hit.
- Mitigation: capture context in a lightweight request-scoped provider populated by a presentation-layer
  interceptor/middleware; keep the audit interceptor itself stateless; unit-test actor/IP propagation.

⚠️ **Table growth**
- Append-only + every mutation = monotonic growth. Not a v1 blocker at this app's volume, but design
  indexes for the two hot queries (by resource, by actor) and avoid over-indexing to protect insert cost.
- Mitigation: the three composite indexes above; partitioning explicitly deferred to v2.

⚠️ **Migration safety (RTE / existing data)**
- Adding the table is additive (low risk), but the `REVOKE` step touches DB roles.
- Mitigation: run via `prisma-migrate` skill; verify the app connection role vs the owner/migration
  role so the app keeps `INSERT` while losing `UPDATE/DELETE`.

## Alternatives Considered

### Pure explicit `AuditService.record()` in every handler
- **Pros:** maximum control; precise before/after everywhere; no interceptor/scope magic.
- **Cons:** boilerplate in 40+ handlers; easy to forget on a new command (a silent gap); noisy diffs.
- **Why not chosen:** the codebase already standardizes `BaseCommand`, so the auto path is nearly free
  and structurally harder to forget. Explicit is kept as the enrichment layer, not the primary.

### Prisma `$use` middleware / DB triggers (capture at the data layer)
- **Pros:** catches *every* write including scripts/seeds; nothing bypasses it.
- **Cons:** loses business intent (which screen, which use case, why, which role); per-row on bulk;
  triggers are a second language (PL/pgSQL) to maintain (the Pydantic/Logfire team migrated *away*
  from triggers for exactly these reasons).
- **Why not chosen:** intent/context is the whole point of an *audit* (vs a change log). A DB trigger
  on a couple of ultra-sensitive tables remains a possible v2 safety-net, not the v1 mechanism.

### Event sourcing (audit log as source of truth)
- **Pros:** full history for free, append-only by construction.
- **Cons:** a large architectural commitment; wrong to bolt onto an existing CRUD system purely for audit.
- **Why not chosen:** disproportionate to a small internal console; the flat `AuditEvent` table meets
  the defensible-minimum bar.

### Cryptographic tamper-evidence in v1 (hash chain / signatures)
- **Pros:** detects tampering even by a privileged actor.
- **Cons:** operational weight (verification, key management) with no current compliance driver.
- **Why not chosen:** research tiering puts this in "nice to have, justify by real risk." Schema leaves
  room (`recordHash`/`prevHash`) so it is an additive v2, not a rewrite.

## Task Breakdown (proposed streams)

Sized for `/ctx:breakdown`. Roughly 9 tasks across 6 streams; next task numbers start at 389.

**Stream A — Data model & storage foundation**
- A1. `AuditEvent` model + enums (`AuditActorType/Outcome/Category`) + Prisma migration (additive); via `prisma-migrate` skill. **[S/M]**
- A2. Append-only enforcement: `REVOKE UPDATE, DELETE` on `audit_events` from the app DB role (migration) + document the owner-bypass caveat in `decisions.md`. **[S]**
- A3. `AuditRepository` (infrastructure) — `insert()` + query methods only (list/filter, by-resource timeline); **no** update/delete methods. **[M]**

**Stream B — Capture backbone**
- B1. `RequestContext` request-scoped provider + presentation-layer interceptor/middleware to populate actor / IP / user-agent / correlationId. **[M]**
- B2. `AuditCommandInterceptor` (auto capture on success + failure) + central **Action Registry** (command→action/resourceType/category) + skip-with-dev-warning for unregistered commands. **[M/L]**
- B3. `AuditService.record()` explicit API + central **redaction/masking** util (secret denylist + PII masklist) + before/after diff helper (`changedFields`). **[M]**

**Stream C — Coverage wiring**
- C1. Auth events via explicit `record()` in auth commands/guards: login succeeded/failed, logout, logout-all, password changed/reset/set, token refreshed. **[M]**
- C2. Enrich sensitive mutations with precise `before/after` (user create/update/delete/role-change; and delete/restore across content domains where prior state matters). **[M]**

**Stream D — Read API & access**
- D1. Audit query API (list/filter + per-resource timeline, keyset pagination) behind an audit-read guard (ADMIN v1; optional additive `AUDITOR` role) + `audit.viewed` self-audit on reads. **[M]**

**Stream E — Console UI**
- E1. Audit Log page: searchable/filterable table (actor, resource, date range, action, outcome) reusing console table/filter primitives. **[M/L]**
- E2. Before/after **diff viewer** (masked fields stay masked) + reusable **per-resource timeline** component embedded on entity detail pages. **[M/L]**

**Stream F — Hardening & docs**
- F1. Contract tests: append-only (no update/delete path), redaction (denylisted fields never persisted), fail-open (audit failure does not fail business op), failure-outcome capture. **[M]**
- F2. Docs: `.context/patterns-architecture.md` audit section + module README + component docs (via `/design document`) for the new UI primitives; ADR in `decisions.md`. **[S]**

Dependency order: A → B → (C, D can parallel) → E → F. E depends on D. C depends on B3. F closes each stream.

## Success Criteria

- [ ] A single admin action (e.g. edit a project) writes exactly one accurate `AuditEvent` with actor,
      action, resource, IP, UTC timestamp, and (for the enriched path) a correct `changedFields` diff.
- [ ] A failed command (validation/permission error) is recorded with `outcome = FAILURE` + error code.
- [ ] Each auth event (login success/fail, logout, password change/reset, token refresh) is recorded
      with the correct actor/attempted-actor and outcome.
- [ ] Attempting `UPDATE`/`DELETE` on `audit_events` via the app connection is rejected by the DB.
- [ ] A contract test proves denylisted secret fields (password/token) never appear in any audit row.
- [ ] Killing the audit write (simulated failure) does not fail or roll back the business operation.
- [ ] The Audit Log page filters by actor / resource / date / action / outcome and shows a working
      before/after diff with sensitive fields masked.
- [ ] An entity detail page shows that entity's history via the reusable timeline component.
- [ ] Reading the audit log is itself recorded as `audit.viewed`.

## Estimated Complexity

**L**

**Reasoning:** Backend cross-cutting infrastructure (interceptor + request-scope + registry + redaction
+ append-only DB enforcement) plus a new read API plus two non-trivial console UI surfaces (filterable
log page + diff/timeline). Individually each task is S/M, but the breadth (backend capture + coverage +
read + FE + tests/docs) and the correctness-sensitive bits (fail-open, redaction, append-only grants)
put the epic at L. It stays out of XL because tamper-evidence, partitioning, alerting, and sensitive-read
auditing are all explicitly deferred.

## Status
ready

## Created
2026-07-13
