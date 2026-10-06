---
name: radar
description: |
  Radar external worker. `/radar work` claims captured AI-news posts from the portfolio API,
  reads each one (text, images, links, shared post), writes a structured enrichment (TL;DR,
  provider tags, content type, signal score, apply note against the Owner's workflow profile)
  and submits it, looping until the queue is empty. `/radar work brief` writes the catch-up
  brief the Owner requested in the console (a window of analyzed posts, grouped by provider and
  topic, with new terms and links to each post). Use this whenever the user says
  "radar work", "/radar", "analyze the radar queue", "enrich radar items", "chạy radar",
  "phân tích bài radar", "viết brief radar", or wants the captured Facebook AI posts processed, even if they do
  not name the skill.
---

# Radar worker

Radar stores public AI-news posts in the portfolio database. The API cannot read them, you can.
This skill is the loop that turns a queue of raw posts into enrichments the console Feed shows.

Arguments: `/radar work [--batch N] [--limit M]`, or `/radar work brief` (section 5). `--batch` is items per claim (default 10, max
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

## 5. Brief mode (`/radar work brief`)

A brief is the catch-up page the Owner requests on the console Briefs page: every analyzed post
of a window (all sources, or one), summarized into one markdown document. Only one brief waits
at a time, so there is at most one to write. Run the Preflight and load the profile (sections 1
and 2) first, then:

1. **Claim:** `radar-api.sh brief-claim <workdir>/brief.json`. "no brief waiting" ends the mode:
   tell the Owner to request one on the Briefs page. Otherwise note the brief id, the window,
   `sourceId` (null means all sources) and the post count.
2. **Read the posts:** `radar-api.sh brief-items <id> <workdir>/brief-items.json`. It saves every
   analyzed post of the window, oldest first, and prints how many fall in each month. Each post
   carries its enrichment (`tldr`, `providerTags`, `contentType`, `signalScore`, `context`,
   `factCheck`, `applyNote`, `linkSummaries`), the post text and `detailPath`, the link a brief
   uses to cite it. Do not Read the whole file at once: pull one month at a time with
   `jq '[.items[] | select(.publishedAt[:7] == "2026-09")]'`.
3. **Summarize per month:** for each month write notes to `<workdir>/brief-<yyyy-mm>.md`: what
   happened per provider, the topics, and every term that appears for the first time (with that
   post's date). Skip promos (`isPromo`) and posts marked not relevant unless they carry real
   news; prefer high `signalScore` posts when several say the same thing. A single month of a
   small window needs no separate notes.
4. **Merge** the month notes into one body, `<workdir>/brief.md`, in this shape:
   - One short opening paragraph, with no `#` title (the page already names the brief): the
     window, the sources, the 3 to 5 changes that matter most for the Owner's workflow profile.
   - `## <Provider>` for each provider with news (Anthropic, OpenAI, Google, ...; tools without
     a provider go under `## Tools and community`), then `### <Topic>` inside, newest change
     last so it reads as a timeline. Each point is one or two sentences.
   - `## New terms`: a list of `**term**: one-line meaning (first seen YYYY-MM-DD)`, the date
     taken from the earliest post that mentions it.
   - `## Timeline`: one line per notable date, oldest first.
5. **Link every claim:** each point ends with the posts it comes from, written exactly as
   `[label](/radar/items/<id>)` (the `detailPath` of the post). The label must read on its own:
   the author and date (`Duy, 05/10`) or the product name (`cf CLI`), never a single letter. Never link a post that is not in `brief-items.json`: the API rejects the
   whole brief if one link points outside the window, and it also rejects a brief with no links.
6. **Submit:** `radar-api.sh brief-submit <id> <workdir>/brief.md <adapter> <model>`, with
   `claude-code` as the adapter and your model id as the model. The answer is
   `{ "id", "itemCount" }`. A 400 names the problem (`RADAR_BRIEF_INVALID_LINKS` lists the bad
   ids in `outsideItemIds`): fix the body and submit once more. The lease is 30 minutes; a late
   submit still lands unless another session already submitted the brief.

Write the brief in Vietnamese, the Owner's language, keeping technical terms and product names
verbatim in English (Claude Code, MCP, context window), and use no em-dashes or en-dashes, as
the Language section of `references/enrichment-guide.md` says. Report the brief id, the post
count and the months covered; the console Briefs page is where it is read.

## Admin helpers (the Owner runs these, never Claude)

`scripts/save-profile.sh <profile.md>` saves the workflow profile and
`scripts/upload-capture.sh <apify.json> [source-url] [name]` uploads an Apify export. Both log
in with the console password, so they belong in the Owner's own terminal: suggest the exact
command, do not run it, and do not use the `!` prefix (its output lands in the chat).

