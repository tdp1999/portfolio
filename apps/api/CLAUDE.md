# CLAUDE.md — `apps/api`

Guardrails that apply only when working inside the NestJS API. Root `CLAUDE.md` still applies on top of these.

| Rule                         | Action                                                                     | Example                                                                 |
| ---------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **No errors in controllers** | Controllers never throw errors — all error logic in command/query handlers | `if (!user) throw NotFoundError(...)` belongs in handler, not controller |
