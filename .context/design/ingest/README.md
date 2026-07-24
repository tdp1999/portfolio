# ingest/ — landing zone

Raw output of `/design ingest` lands here first, before it is curated into a permanent bucket.
Keeping it separate stops half-digested notes from piling at the bank root.

## Flow

1. **Ingest** drops a distilled note here (`<source-slug>.md`) with its provenance.
2. **Curate** — decide where each rule truly belongs:
   - Universal (would help another project) → push to the global skill, add a row to the skill's
     `sources.md`, and (if it specializes something) leave a thin residue in `patterns/`.
   - Project-specific → move into `system/`, `contracts/`, `cookbook/`, `patterns/`, or
     `components/`, and add a row to the project `../sources.md`.
3. **Promote & delete** — once curated, remove the raw note here. This folder should trend empty;
   anything lingering is un-curated debt.

Nothing here is authoritative. A rule is only "in the bank" once it has been promoted to its
bucket. Do not link to `ingest/` files from other docs.
