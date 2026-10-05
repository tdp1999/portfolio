# Enrichment guide

How to write one Radar enrichment. The API validates the shape (Zod schema in
`apps/api/src/modules/radar/application/radar-enrichment.schema.ts`); this guide is about
writing values that are useful to the Owner, a frontend engineer catching up on a year of AI
news before a new job.

## Language

Write `tldr`, `imageNotes`, `linkSummaries[].summary`, `commentDigest`, `factCheck` and
`applyNote` in the post's own language (RAD-002). Most sources post in Vietnamese, so most
enrichments are in Vietnamese. Keep technical terms and product names verbatim in English
(Claude Code, MCP, context window, fine-tune), never translate them into a calque. Do not use
em-dashes or en-dashes; use commas, colons or a new sentence.

## Fields

| Field | Rule |
| --- | --- |
| `tldr` | One sentence, at most 280 characters. What happened or what is claimed, with the concrete subject: "Anthropic ra Claude Opus 5.5, giá giữ nguyên, context 1M", not "Một bài về model mới". |
| `providerTags` | Who the post is about: `anthropic`, `openai`, `google`, `meta`, `xai`, `deepseek`, `opensource` (open-weight models and OSS tools not owned by one of the others), `other` (any other company). Several are fine. Empty only when no provider is involved (pure opinion on "AI in general"). |
| `contentType` | One of `news` (a release, price change, event), `tool` (a specific tool or library worth trying), `workflow` (how someone works with AI, prompts, setups), `opinion` (take or prediction without new facts), `tutorial` (step-by-step how-to), `promo` (selling a course, a service, a paid group). |
| `signalScore` | Integer 0 to 10, see the scale below. |
| `isPromo` | True when the post's main purpose is selling something, even if it also contains information. A promo can still score 3 to 5 when the information part is real. |
| `isRelevant` | True when it matters for someone who builds web frontends and works daily with Claude Code. Image-generation art, crypto, or pure business gossip are usually false. |
| `imageNotes` | What the images say that the text does not: numbers on a benchmark chart, steps in a screenshot, code on a slide. Null when there are no images or they add nothing. Mention images that failed to download. |
| `linkSummaries` | One entry per link you actually read: `{ "url", "summary" }`, summary at most 1000 characters, focused on what the link adds to the post. Leave out links you could not open. |
| `commentDigest` | Null for now (comments arrive in a later phase). |
| `factCheck` | Claims that look wrong, outdated, unverifiable or exaggerated, and what you checked. "Bài nói X miễn phí, trang pricing hiện ghi $20/tháng." Null when nothing needs flagging. |
| `applyNote` | Markdown, see below. Null only for promos and irrelevant posts. |
| `producer` | `{ "adapter": "claude-code", "model": "<your exact model id from the system prompt>" }` |
| `schemaVersion` | `1` |

## Signal score

| Score | Meaning | Example |
| --- | --- | --- |
| 9 to 10 | Changes how the Owner should work this month | A new Claude Code capability, a major model release they will use |
| 7 to 8 | Worth reading in full | A solid workflow with concrete steps, an important tool release |
| 4 to 6 | Good to know, the TL;DR is enough | Minor release, a reasonable opinion with some substance |
| 1 to 3 | Low value | Rehashed news, vague hype, mostly promo |
| 0 | Nothing usable | Pure ad, meme, off-topic |

Old news is judged at the time of posting, not today: a 6-month-old release that was big
then is still a high score, because the Owner is catching up.

## Apply note

The note answers "what should I do with this, given how I already work?". Compare the post
against the profile body:

- When the post describes something the profile already contains, start with
  **"Đã có trong setup của bạn:"** (or "Already in your setup:" for an English post) and name
  the matching part, then say only what is new, if anything.
- Otherwise give one to three concrete actions: what to try, where it would fit in the
  Owner's existing workflow, and what it would replace. Name the tool or setting.
- Say plainly when the post is not worth acting on, and why.
- Keep it short: a few bullets, not an essay.

Example (Vietnamese post about a Claude Code hooks feature, profile already lists hooks):

```markdown
Đã có trong setup của bạn: hook pre-commit chạy Prettier qua husky và các hook trong `.claude/hooks`.
- Cái mới là hook `PostToolUse` lọc theo tên tool, có thể dùng để tự chạy `tsc` sau mỗi lần sửa `.ts`.
- Đáng thử một lần, thay cho việc nhớ chạy type check thủ công.
```

## Shared posts

When `sharedPost` is present, the shared content is usually the actual news and the item's
own text is the sharer's comment. Analyse both: the TL;DR covers the news, and mention the
sharer's take only if it adds something.
