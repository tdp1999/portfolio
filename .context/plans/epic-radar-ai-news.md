# Epic: Radar (AI news catch-up)

## Summary

Radar is a console feature that pulls the public Facebook posts of a few AI influencers into the portfolio database, runs them through a multi-step pipeline (capture, normalize, enrich, analyze, synthesize) where every step uses a swappable provider adapter, and presents the result as a skimmable Feed with a full Detail view per post. Each post gets a one-line TL;DR, provider and content-type tags, a signal score, a promo flag, a digest of its images, links and comments, and a note on how it applies to the Owner's own AI workflow. The first source is `facebook.com/mrgoonie` with a 6-month backfill.

## Why

The Owner stopped following AI news for about a year and starts a new, higher-performance job around November 2026. The best filtered signal for the Vietnamese AI scene lives on a handful of influencers' Facebook profiles, but those posts are numerous and long, and Facebook offers no way to dig through history. Reading, checking images, opening sources and deciding what applies would take months by hand. Radar turns a catch-up into one triggered run plus one reading session, and stays useful afterwards every time the Owner falls behind again.

## Target Users

- The Owner (single user, admin of the console). Sharing with other people is explicitly the lowest priority.
- Claude Code acting as an external worker on the Owner's behalf (machine client, not a human user).

## Scope

### In Scope (this epic = Phase A + Phase B)

**Phase A: usable first**
- Prisma models for sources, runs, step runs, items, enrichments, briefs and the workflow profile.
- Manual capture: upload a JSON file exported from an Apify run through the console.
- Apify normalizer: maps the Apify Facebook posts payload into `RadarItem`, dedupes by `externalId`, keeps the raw payload.
- Image persistence: post images are copied to Cloudinary through the existing storage port, because Facebook CDN URLs expire.
- Machine-token auth for a non-human client.
- `ExternalWorker` LLM adapter: the API exposes pending work, Claude Code claims it, analyzes it, and submits results.
- Project skill `/radar work` (in `.claude/skills/radar/`, checked into git so it survives the laptop return).
- `RadarWorkflowProfile`: the Owner's current AI setup as editable text, drafted by Claude from the Owner's config and stored in the DB.
- Console `feature-radar`: Feed page (skim list with filters) and Item Detail page (`console-record-*` family).

**Phase B: Hybrid flow**
- Apify capture adapter calling the Apify API server-side (start, poll, fetch), selected per run.
- DB-backed run state machine advanced by a `@nestjs/schedule` cron tick.
- Runs page: trigger a run from the console and watch per-step progress (polling).
- Comments: capture comments for each post and include a comment digest in enrichment.
- Synthesize step and Brief page: a catch-up brief for a chosen time window.

### Out of Scope (follow-up epic, Phase C)
- `Gemini` and `Anthropic` server-side LLM adapters (the fully automatic flow).
- Bright Data and ScrapeCreators capture adapters (only if Apify loses the bake-off).
- Video transcripts.
- Sources other than Facebook profiles, and other influencers beyond the first one (adding a source row is in scope; tuning for many sources is not).
- Recurring or scheduled runs and notifications. Runs only start when the Owner triggers them.
- Translation. Content stays in the source language; technical terms stay verbatim.
- Any use of the Owner's own Facebook account or session.
- Multi-user access or sharing.

## High-Level Requirements

1. When the Owner uploads an Apify Facebook posts JSON file for a source, the API shall create one `RadarItem` per post that has not been seen before for that source.
2. If an uploaded post has an `externalId` that already exists for the same source, then the API shall update its mutable fields (text, engagement, media) and shall not create a second item.
3. If the uploaded file fails schema validation, then the API shall reject the upload with a field-level error and shall create no items.
4. The API shall store the provider's raw payload on every `RadarItem` so the item can be re-normalized without capturing again.
5. When an item is normalized, the API shall copy each of its images to Cloudinary and store the Cloudinary URL on the item.
6. If an image download fails, then the API shall keep the item, mark that image as failed, and continue with the remaining images.
7. When a client presents a valid machine token, the API shall allow it to call only the Radar worker endpoints.
8. If a request to a Radar worker endpoint carries a missing or invalid machine token, then the API shall respond 401 and shall not change any data.
9. When the external worker claims work for a step, the API shall return at most the requested number of items and mark them as claimed with a lease expiry.
10. If a claimed item's lease expires before results arrive, then the API shall return that item to the pending pool.
11. If submitted enrichment results fail schema validation, then the API shall reject that item's result with an error and leave the item pending.
12. The Feed page shall list items newest first, showing per item: publish date, TL;DR, provider tags, content-type tag, signal score, promo flag, and a "relevant to me" flag.
13. The Feed page shall filter items by provider tag, content-type tag, minimum signal score, and promo visibility.
14. The Feed page shall search post text and TL;DR.
15. When the Owner opens an item, the Detail page shall show the original post text, persisted images with their extracted content, link summaries, comment digest, fact-check notes, and the apply-to-my-workflow note, with tags, score, date and original URL in the property rail.
16. Where a run is configured with the Apify API capture adapter, the API shall start the Apify job, poll it on each cron tick, and ingest the dataset when the job succeeds.
17. If the Apify job fails or exceeds the run's item cap, then the API shall mark the capture step as failed with the provider's error message, and the Runs page shall show it.
18. When the Owner requests a brief for a time window, the system shall produce one `RadarBrief` that groups the window's items by provider and topic and lists new terms with their first-seen date.
19. The API shall keep provider secrets (Apify token, machine token) server-side only; no console response shall contain them.

## Technical Considerations

### Architecture
- New API module `apps/api/src/modules/radar/` following the standard CQRS layering (`presentation/ application/{commands,queries,ports,jobs} domain/ infrastructure/`), Zod validation inside commands and queries, presenters for responses.
- Two port families, copied from the media `STORAGE_SERVICE` pattern (`media.token.ts`, `storage.factory.ts`, `useFactory` in `media.module.ts`):
  - `CAPTURE_PROVIDER`: job-shaped interface `start(source, window, cap) → jobRef`, `poll(jobRef) → status`, `fetch(jobRef) → raw[]`, plus `normalize(raw) → RadarItemDraft`. A synchronous provider is a job that completes on the first poll. Adapters: `UploadCapture` (Phase A), `ApifyCapture` (Phase B).
  - `LLM_PROVIDER`: `process(step, items, profile) → results | AwaitingExternal`. Adapter `ExternalWorker` (Phase A). Unlike media, the adapter is chosen **per run** (stored on `RadarStepRun`), not once per process, so the factory resolves by name at call time.
- No queue. `RadarRun` and `RadarStepRun` hold state (`pending → running → awaiting-external → done | failed`). A cron tick (every minute) does small bounded batches only when an active run exists. Template: `media/application/jobs/media-cleanup.job.ts` dispatching through `CommandBus`.
- Machine token: a new `MachineTokenGuard` that compares a bearer token against a hashed value from env, constant-time, and is applied only to the worker controller. Separate from `JwtAccessGuard`/`CsrfGuard`.
- Outbound HTTP via native `fetch` with an `AbortSignal` timeout (the existing `turnstile-verify.service.ts` has none; do not copy that gap). No Apify SDK needed for three endpoints.
- Config read through `process.env` with a required-var helper, like `auth/application/auth.config.ts`.
- Console: new lib `libs/console/feature-radar` (create with the `ng-lib` skill), mounted under the `adminGuard` group in `apps/console/src/app/app.routes.ts`. Service wraps `ApiService`. Feed uses existing `FilterBar`/`FilterSearch`/`FilterSelect`; Detail uses `console-record-layout` and `console-property` per ADR-026.
- Skill `/radar work` lives in the repo at `.claude/skills/radar/`, reads the machine token and API base URL from environment variables the Owner sets, and loops claim → analyze → submit.

### Capture provider decision (task 400, 2026-10-04)
- **Actor:** `apify/facebook-posts-scraper` (official). Despite its docs saying "pages only", it returns personal-profile timelines (mrgoonie) and honors the date window. Pricing is pay-per-event, no platform usage charge. Measured on the free plan: $0.005 per post + $0.002 per post for the date-filter add-on + $0.001 per actor start (50 posts with a window = $0.351).
- **Input:** `startUrls: [{url}]`, `resultsLimit`, `onlyPostsNewerThan`, `onlyPostsOlderThan` (YYYY-MM-DD), `captionText: false`.
- **Probe result:** 50 posts for 2026-08-06..08-14, so the profile posts about 6 per day; a 6-month backfill is about 1,000-1,100 posts: about $5.3 without the date filter (newest N posts) or $7.4 with it. Use the date filter only for incremental runs; backfill with `resultsLimit` alone.
- **Useful fields:** `postId`, `url`, `time`, `text` (complete, not cut at "See more"), `media[]` with `image.uri`/`thumbnail` and Facebook's own `ocrText`, `link` (external link card), `sharedPost` (original post of a share), `isVideo`, engagement counts, `topComments` (only the pinned comment).
- **Noise to filter in the normalizer:** `link` is usually the author's pinned "subscribenow" promo URL; `topComments` is that same pinned promo comment. Real source links often live in regular comments ("link ở dưới còm"), which needs the comments actor (task 411).
- **Rejected:** `maximedupre/facebook-user-posts-scraper` returned only the 8 newest items without a window, and ran out of memory (256 MB cap set by the developer) when asked for an older window.

### Dependencies
- Apify account and API token (Owner creates; token goes into Railway variables, never into chat or the repo).
- Existing media storage port (Cloudinary) for image persistence.
- Railway Postgres (existing) via the `prisma-migrate` skill.
- Bake-off result (Apify vs Bright Data) only affects Phase C; Phase A and B assume Apify.

### Data Model
- `RadarSource`: platform, URL, display name, active flag.
- `RadarRun`: source, window (from, to), flow (`manual | hybrid`), item cap, status, counts, error.
- `RadarStepRun`: run, step (`capture | normalize | enrich | analyze | synthesize`), adapter name, status, provider job ref, timestamps, error.
- `RadarItem`: source, `externalId` (unique per source), author, published at, permalink, text, media (JSON: original URL, Cloudinary URL, status), links (JSON), comments (JSON, Phase B), raw payload (JSONB), work status and lease expiry.
- `RadarEnrichment`: item (1:1 current), TL;DR, provider tags, content-type tag, signal score (0-10), promo flag, relevant flag, image notes, link summaries, comment digest, fact-check notes, apply note, producer (adapter + model), schema version.
- `RadarBrief`: window, body (markdown), item ids covered, producer.
- `RadarWorkflowProfile`: single row, markdown body, updated at.
- None of these fields are rich-text editor fields, so the ADR-023 four-column contract does not apply. Plain text and markdown only.

## Risks & Warnings

⚠️ **Scraper fragility**
- Facebook changes its markup often; any Apify actor can break or start returning partial data (truncated "See more" text, missing images).
- Mitigation: keep the raw payload, validate the normalized shape, record per-run counts so a sudden drop is visible, and keep the capture adapter swappable.

⚠️ **Profile vs Page support**
- Vendor docs disagree on whether personal profiles are supported. mrgoonie is a personal profile.
- Mitigation: Task 1 of the breakdown is a small Apify run (about 50 posts) to confirm coverage before the normalizer is written against real fixtures.

⚠️ **Expiring Facebook image URLs**
- Image URLs are signed and die within days. If normalize runs late, images are lost.
- Mitigation: copy images during normalize, immediately after capture, and mark per-image failures instead of failing the item.

⚠️ **Media cleanup job collision**
- `media-cleanup.job.ts` removes orphaned media. If Radar images are registered as `Media` rows without a reference the job understands, they may be deleted.
- Mitigation: upload through the storage port into a dedicated `radar/` folder without creating `Media` rows, or teach the cleanup job to skip that folder. Decide in the image task.

⚠️ **External worker reliability**
- Claude Code sessions end mid-batch; results can arrive twice.
- Mitigation: leases with expiry, idempotent submit keyed by item and step, Zod validation of every submitted result.

⚠️ **Machine token blast radius**
- A leaked token would allow writing enrichment data.
- Mitigation: the guard scopes the token to worker endpoints only; the token is stored hashed in env and can be rotated by changing one variable.

⚠️ **Railway memory and runtime**
- The pipeline runs inside the API process (no queue), on a plan where memory held 24/7 costs money (see task 387).
- Mitigation: bounded batches per cron tick, no in-memory accumulation of whole datasets, stream the Apify dataset page by page.

⚠️ **Terms of Service**
- Scraping public posts conflicts with Meta's terms. Risk is carried by the scraping provider, not the Owner's account, because the Owner's session is never used. Personal, non-commercial use.

## Alternatives Considered

### Standalone app (local files or Vercel) first, console later
- **Pros:** first readable output within hours.
- **Cons:** the work laptop is returned in 1-2 weeks so local storage is lost; the workflow would be built twice.
- **Why not chosen:** the Owner chose to spend a few days once in the console.

### Logged-in browser automation (Playwright with the Owner's session)
- **Pros:** sees everything, no provider cost.
- **Cons:** risks the Owner's personal account; fragile.
- **Why not chosen:** hard boundary set by the Owner.

### Job queue (BullMQ + Redis)
- **Pros:** retries, concurrency and visibility out of the box.
- **Cons:** new infrastructure and a second always-on service on Railway for a single-user, on-demand tool.
- **Why not chosen:** a DB state machine plus a cron tick covers the load.

### Server-side LLM from day one (Gemini free tier)
- **Pros:** fully automatic.
- **Cons:** variable rate limits; the model knows nothing about the Owner's workflow, so the apply note is generic.
- **Why not chosen as default:** Claude Code as an external worker costs nothing extra and already knows the Owner's setup. Server adapters arrive in Phase C.

## Success Criteria

- [ ] When the Owner uploads one Apify export covering 6 months of mrgoonie posts, the Feed lists every post in the file exactly once.
- [ ] After one `/radar work` session finishes, every listed item shows a TL;DR, tags, and a signal score.
- [ ] Opening any item shows its images loaded from Cloudinary 7 days after capture.
- [ ] Filtering by minimum score 7 with promo hidden returns only items matching both conditions.
- [ ] A Hybrid run triggered from the Runs page reaches `awaiting-external` without manual file handling, and reaches `done` after one `/radar work` session.
- [ ] A brief for the last 6 months exists and lists new terms with first-seen dates.
- [ ] The full flow runs against production (Railway) end to end at least once before the laptop return.

## Testing Approach

Light, by the Owner's choice (urgent). Must run end to end.
- Unit tests only where logic is real: the Apify normalizer (against a captured fixture), dedupe, lease expiry, enrichment result schema, and the machine-token guard.
- No component tests for the console pages; verified by one manual walkthrough per page.
- Each task closes with an acceptance-criteria check against real data, not mocks.

## Estimated Complexity

L

**Reasoning:** a new API module with two port families, a state machine, a new auth guard, an external worker protocol, a migration with 7 models, a new console feature lib with 4 pages, and a project skill. Roughly 10-11 tasks across Phase A and B. Phase C is kept as a separate follow-up epic to stay within the 10-task guideline.

## Specialized Skills

- **prisma-migrate** — additive migration with safety checks → task 401
- **be-test** — tests only the real logic (normalizer, dedupe, guard, lease, state machine) → tasks 402, 404, 409
- **skill-creator** — structure and description of the `/radar work` skill → task 405
- **ng-lib** — generate `libs/console/feature-radar` → task 406

## Status

broken-down

Broken down into tasks 400-412 on 2026-10-04 (Phase A: 400-408, Phase B: 409-412).

## Created

2026-10-04
