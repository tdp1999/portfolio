# Learning Notes — `hieubui2409/human-analyzer`

> Study output from `/study-repo`. Source repo cached at
> `~/.repomix-bank/hieubui2409__human-analyzer__master__compress.xml`
> (branch `master`, SHA `f4dadab`, packed 2026-06-08, fresh ~14 days).
> Re-study / refresh: `/study-repo https://github.com/hieubui2409/human-analyzer`.

## What it is (one line)

A **Claude Code framework toolkit** — not an app — for building **clinical-grade
psychological profiles of people** (real or fictional) from source materials, then
using those profiles for **content creation** and **growth/career analysis**.

## Public toolkit vs. hidden data — important

The repo ships the **engine only**. There is **no secret engine**; what's stripped
out is the **real-person data** (both inputs and generated outputs), removed by a
non-removable `safety_filter` in `build_pack.py` because it's PII:

- `docs/profiles/` — generated psych profiles of real people (~82 files privately)
- `docs/materials/` — raw source material (~40 files privately)
- `docs/graph/` — relationship graph between real people
- `docs/references/` — clinical theory library tied to real people

What you DO get: skills, agents, hooks, `platform_lib` (Python), schemas, rules,
a synthetic `e2e/` fixture (`test-alpha`, `test-beta`), tests, CI.

## Core mental model — 3 ideas

1. **Evidence before claim.** Every statement traces to a source tagged T1 (primary)
   → T5 (inference), CRAAP-scored (≥15/25 to integrate). Publishing is gated per-claim:
   T1/T2 pass, T3 warn, T4/T5 fail.
2. **Clinical depth, no jargon in output.** Internals use DSM-5 / ICD-11 / attachment
   theory / Vaillant defense ladder / 5P formulation; published content is
   "show-don't-tell" — no raw labels leak.
3. **Event-driven cascades.** `MAT.integrated → PSY.refresh → CRE.recalibrate`.
   Change upstream, it propagates; no domain silently diverges.

## The 6 domains (skill prefixes)

| Prefix | Role | Notable skills |
|---|---|---|
| **mat** | Materials intake → tiered evidence | `mat:loader`, `mat:indexer` (blocks analysis until integrated) |
| **psy** | Clinical profiling (16 skills) | `psy:wave` (3-wave build), `psy:crossref`, `psy:crisis-assess` (never cached), `psy:hypothesis` |
| **cre** | Profile → platform content | `cre:post-writer` (7-stage pipeline), `cre:privacy-guard`, `cre:humanize`, `cre:voice-audit` |
| **gro** | Career / competency / learning | `gro:career-path` (Super), `gro:competency-map` (Dreyfus), `gro:learning-profile` (Kolb); forecasts flagged `[FORECAST]` |
| **orc** | Orchestration / event bus / graph | `orc:intake`, `orc:cascade`, `orc:event-log` (JSONL), `orc:graph`, `orc:council` |
| **com** | Shared utilities | `com:git`, `com:health-check`, `com:skill-analytics` |

## Architecture patterns worth stealing (for our own skills)

- **Skill anatomy:** each skill = `SKILL.md` (contract: triggers/flags/scripts/events)
  + `README.md` + bilingual `GUIDE-EN/VI.md` + `scripts/`. IDs: `psy:hypothesis`
  (invoke) ↔ `psy-hypothesis` (dir).
- **Deterministic script / LLM split:** Python scripts gather data deterministically;
  the LLM does the reasoning. Scripts never "decide," they prepare structured input.
- **Fail-open hooks as write-time gates:** `pii-guard-on-write`,
  `gateguard-profile-protect` block sensitive edits (exit 2); drift/observe hooks only
  signal. A hook's own error never blocks the tool.
- **Verdict cache w/ explicit contract:** keyed `check | scope | content-hash | dep-hash`;
  crisis & narrative-twist verdicts are **never cached**.
- **Knowledge graph:** plain-dict adjacency from frontmatter (conf 0.95) + body-scan
  (0.65–0.80); embeddings deliberately deferred (YAGNI). No networkx/numpy at runtime.
- **Deterministic packaging:** byte-identical tar, per-file SHA256, `public-ci-guard.yml`
  fail-closed perimeter to stop private corpus leaking into the public repo.

## Profile data model (reference)

Per character, a fixed ~25-file tree: `identity/`, `psychology/` (5P `formulation.md`,
`defense-mechanisms.md`, `attachment-style.md`, `diagnostics.md` w/ OCEAN + ICD-11 trauma,
`cultural-formulation.md`), `darkness/`, `light/`, `relationships/`, `timeline/`,
`evidence/`, `growth/`. Every file carries frontmatter (`character`, `references`,
`cross_characters`, `confidence`, `updated_by`).

---

## How this could help content for THIS portfolio (open question — not yet decided)

The landing portfolio needs written copy (hero, about/bio, project write-ups, DDL prose).
The directly transferable pieces from human-analyzer:

- **`cre:humanize` idea** — a checklist/scan for "AI tells" (VN + EN) to de-slop portfolio
  copy so it reads human. Could be adapted as a lightweight review pass on landing text.
- **`cre:voice-audit` + `identity/writing-voice.md` idea** — define a single
  **writing-voice profile** (tone, vocabulary, rhythm, do/don't) for the portfolio, then
  check every new piece of copy against it for consistency.
- **"Show-don't-tell" + evidence discipline** — instead of asserting "I'm a great engineer,"
  back claims with concrete artifacts (the portfolio's own version of evidence tiers).
- **NOT a fit:** the psych-profiling machinery (`psy:*`, `mat:*`, `orc:*`) — overkill for
  portfolio copy. Don't import the framework wholesale.

**Possible next step (undecided):** distill a tiny "portfolio writing-voice + humanize
checklist" into `.context/design/` or a small skill, borrowing only the cre/voice ideas —
without adopting the profile/corpus model. Revisit when ready to write landing copy.
