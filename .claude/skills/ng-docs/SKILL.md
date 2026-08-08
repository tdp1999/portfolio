---
name: ng-docs
description: |
  Look up Angular framework behavior from official docs via the angular-cli MCP server, pinned to this
  repo's Angular version (v21). Use when a task depends on how an Angular API actually behaves: an
  unfamiliar or new API (linkedSignal, resource, httpResource, signal forms, zoneless, @defer), whether
  something is stable or experimental in v21, a signature or option you would otherwise guess, or an
  error message coming from the framework rather than app code. NOT a pre-edit checklist -- do not
  invoke on every .ts change.
  Triggers: "Angular API", "how does X work in Angular", "is X stable in v21", "linkedSignal", "resource",
  "httpResource", "signal forms", "zoneless", "Angular docs", "ng-docs", "/ng-docs"
---

# Angular Docs Lookup

Query the official Angular documentation through the `angular-cli` MCP server instead of answering
from memory. Model knowledge lags the framework; `search_documentation` hits angular.dev live.

## Precedence: project contracts win

The MCP server returns **framework-wide** guidance. This repo's own rules are narrower and take
priority when they disagree.

| Source | Authority |
| --- | --- |
| `.context/angular-style-guide.md` | **Highest.** v21-specific, 15 sections, written for this codebase |
| `CLAUDE.md` guardrails + `.context/patterns-*.md` | **Highest.** File naming, module boundaries, typography scale, component domains |
| `get_best_practices` output | Fallback only. Generic, not version-pinned (see below) |

If the MCP guidance contradicts a `.context/` contract, follow the contract and say so in your
response. If the guidance contradicts what the **codebase actually does**, ask before changing
either -- do not silently migrate a pattern.

## Tool notes verified against this repo

### `search_documentation` -- the one to use

Always pass `version: 21`. Read the `searchedVersion` field in the response to confirm what was
actually queried.

Set `includeTopContent: false`. The flag fetches content for the **top-ranked result only**, and the
result you want is frequently ranked lower -- a query for `linkedSignal` puts the API reference at
rank 1 and the actual guide at rank 3. Treat the tool as a **version-correct URL finder**, then fetch
the page you picked with WebFetch.

### `list_projects` -- do not call in this repo

This is an Nx workspace with `project.json` files and **no `angular.json` anywhere**. The tool reads
`angular.json`, so it returns zero projects here. Worse, when other working directories are attached
it reports unrelated workspaces -- it has surfaced an Angular **16** workspace from `document-engine`,
which would pull in standards four majors out of date.

Consequence: there is no `workspacePath` to obtain, so never pass that argument to any tool.

### `get_best_practices` -- generic only, low value here

Without `workspacePath` it returns the CLI's bundled generic guide (~2.3KB), not a v21-pinned one.
Nearly everything in it is already covered in more detail by `.context/angular-style-guide.md`.
Call it only when working outside this repo's documented areas.

### `find_examples` -- usually empty

Its database covers **new and recently updated** features. Queries for stable APIs come back empty
(`linkedSignal`, stable since v20, returns nothing). Try it at most once, only for a genuinely new
feature, and move on when it returns `{"examples": []}`.

## Recipe

Two calls, not seven:

1. `search_documentation` with `version: 21` and `includeTopContent: false`. Scan the result list and
   pick the URL whose breadcrumb says `Docs` (the guide) rather than `Reference` (the API dump).
2. WebFetch that URL.

Then answer, and cite the URL so the claim is checkable.

## Scope discipline

Do not call this MCP before routine edits. It earns its cost when the answer would otherwise be a
guess about framework behavior. For layout, spacing, typography, naming, and component-domain
questions, the `.context/` bank is the source of truth and this skill is the wrong tool.
