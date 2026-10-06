---
name: radar
description: |
  Radar external worker. `/radar work` claims captured AI-news posts from the portfolio API,
  reads each one (text, images, links, shared post), writes a structured enrichment (TL;DR,
  provider tags, content type, signal score, apply note against the Owner's workflow profile)
  and submits it, looping until the queue is empty. Use this whenever the user says
  "radar work", "/radar", "analyze the radar queue", "enrich radar items", "chạy radar",
  "phân tích bài radar", or wants the captured Facebook AI posts processed, even if they do
  not name the skill.
---

# Radar worker

Radar stores public AI-news posts in the portfolio database. The API cannot read them, you can.
This skill is the loop that turns a queue of raw posts into enrichments the console Feed shows.

Arguments: `/radar work [--batch N] [--limit M]`. `--batch` is items per claim (default 10, max
10 because one submit takes at most 10 results). `--limit` caps the items handled in this
session (default 30) so the context does not run out; the next session continues where this
one stopped.

All API calls go through `scripts/radar-api.sh` (path relative to this skill). It reads
`RADAR_API_URL` and `RADAR_WORKER_TOKEN` and never prints the token. Do not call the API with
your own `curl`, do not echo or `env | grep` the token, and never ask the user to paste it.

## 1. Preflight

Run `bash <skill>/scripts/radar-api.sh check`. If it exits non-zero, show its message and
stop: a missing variable is fixed by the user in `~/.zshenv` (the Bash tool does not load
`~/.zshrc`), a 401 means the token and the API hash do not match.

Pick a work directory: the session scratchpad if the system prompt names one, otherwise
`mktemp -d`. Every claim, image and results file of this session goes there.

## 2. Load the profile

`radar-api.sh profile` returns `{ "body": "<markdown>", "updatedAt": ... }`. Read the body
once; it describes the Owner's tools, skills and habits. Every `applyNote` is written against
it. An empty body is allowed: then write apply notes for a frontend engineer who works with
Claude Code daily, and say in the final report that the profile is empty.

## 3. Loop

Repeat until a claim returns zero items or `--limit` is reached:

1. **Claim:** `radar-api.sh claim <batch> <workdir>/claim-<n>.json`, then read that file.
   The lease is 30 minutes, so finish and submit a batch well within that. Each item carries
   `comments: { status, items }` (fetched by the run, or `NOT_FETCHED`); the Comments section
   of `references/enrichment-guide.md` says how to use them. Never fetch comments yourself.
   While a run is still fetching comments, the claim holds back that run's posts that have no comments yet, so an empty
   claim can mean "wait a few minutes" when a run is active.
2. **Images:** `radar-api.sh images <workdir>/claim-<n>.json <workdir>/img-<n>` and Read
   every file it lists. Images in these posts are usually slides, screenshots of tools or
   benchmark charts, and they often carry the actual news. Files are named
   `<itemId>-<own|shared>-<n>.<ext>`: `own` images belong to the post, `shared` ones to its
   shared post. Lines starting with `skip` are images that could not be fetched; mention that
   in `imageNotes` instead of guessing. The last line counts saved and skipped images, use it
   for the final report.
3. **Research:** for each item, look up the tools, models and claims it names, following
   the Research section of `references/enrichment-guide.md`. This feeds `context`,
   `scoreReason` and `factCheck`.
4. **Links:** open each link in `links` (and in the shared post) with WebFetch to write
   `linkSummaries`. Skip facebook.com / fb.watch links: they need a login and Radar never
   uses the Owner's social accounts (RAD-003). A link that fails to load gets no summary
   entry; note the failure in `factCheck` if the post's claim depends on it.
5. **Write** one enrichment per item, following `references/enrichment-guide.md` (read it
   once per session before the first batch). Write the batch as
   `{"results":[{"itemId": "...", "enrichment": {...}}]}` to `<workdir>/results-<n>.json`.
6. **Submit:** `radar-api.sh submit <workdir>/results-<n>.json`. The answer is
   `{ "stored": k, "rejected": [{ "itemId", "reason" }] }`.
7. **Fix once:** for each rejected item, read the reason (it names the field), fix that
   enrichment, and submit the fixed ones again in a new results file. A rejected item keeps
   its lease, so this works inside the same session. If an item is rejected a second time,
   stop retrying it and list it in the final report; its lease expires and it returns to the
   queue later (after 3 claims the console shows it as stuck).

Each batch is independent: you do not need earlier batches' posts in mind to handle the next.

## 4. Report

When the loop ends, print:

- processed: items stored
- failed: items still rejected after the retry, with item id and reason
- skipped images and unreadable links, as counts
- why the loop stopped: queue empty, or `--limit` reached (then say "run `/radar work` again
  to continue")

Do not summarise the posts themselves in the report; the Feed is where they are read.

## Admin helpers (the Owner runs these, never Claude)

`scripts/save-profile.sh <profile.md>` saves the workflow profile and
`scripts/upload-capture.sh <apify.json> [source-url] [name]` uploads an Apify export. Both log
in with the console password, so they belong in the Owner's own terminal: suggest the exact
command, do not run it, and do not use the `!` prefix (its output lands in the chat).

