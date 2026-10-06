# Enrichment guide

How to write one Radar enrichment. The API validates the shape (Zod schema in
`apps/api/src/modules/radar/application/radar-enrichment.schema.ts`); this guide is about
writing values that are useful to the Owner, a frontend engineer catching up on a year of AI
news before a new job.

## Language

Write `tldr`, `context`, `scoreReason`, `imageNotes`, `linkSummaries[].summary`,
`commentDigest`, `factCheck` and `applyNote` in the post's own language (RAD-002). Most sources post in Vietnamese, so most
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
| `commentDigest` | From the claim's `comments.items`, see Comments below. Null when `comments.status` is `NOT_FETCHED` or `FAILED`, or when the comments add nothing to the post. |
| `wantsComments` | True only when `comments.status` is `NOT_FETCHED` and the post depends on its comments: "link dưới còm", "chi tiết trong comment", a heated thread the post replies to. It shows a hint in the console; it never fetches anything. False otherwise. |
| `factCheck` | Claims that look wrong, outdated, unverifiable or exaggerated, and what you checked. "Bài nói X miễn phí, trang pricing hiện ghi $20/tháng." Null when nothing needs flagging. |
| `context` | Required, markdown, at most 4000 characters. The background the post assumes the reader knows, from your research (see below): for each tool, model or company the post names, what it is, who makes it, when it came out, price if relevant, and how it compares with the obvious alternatives. Two to five bullets. This is what lets the Owner understand a one-line post cold. |
| `scoreReason` | Required, at most 1000 characters. One to three sentences on why this `signalScore`, `contentType` and `isRelevant`: what the post offers (a fact, a number, a workflow) and what it lacks. The Owner reads it to decide whether to disagree with the score. |
| `applyNote` | Required, markdown, see below. For promos and off-topic posts it is one line saying why there is nothing to do. |
| `producer` | `{ "adapter": "claude-code", "model": "<your exact model id from the system prompt>" }` |
| `schemaVersion` | `2` |

## Comments

`comments.items` holds what the API kept: every comment by the post's author (`isAuthor: true`,
full text) and the best other comments labelled `substantive` (text cut to 500 characters).
Spam and filler never reach the claim. `PARTIAL` means the run's charge cap stopped early, so
the list is not the whole thread.

- Read the author's comments first: they often hold the link, the price or the screenshot the
  post points to. Treat their links like `links` (read them, summarise in `linkSummaries`) and
  their image `ocrText` like an image.
- Write `commentDigest` as two to four bullets: corrections, counter-arguments, real usage
  reports, and what the author added. Quote the author verbatim when the detail matters.
- Never name a commenter. Say "một người dùng", "một bình luận"; only the post's author may be
  named, and only as the author.
- A comment that contradicts the post with evidence belongs in `factCheck` too.

## Research

Posts are often one or two lines that assume the reader follows the news. Before writing,
look up what the post names, so `context` and `factCheck` rest on sources, not memory:

- Run WebSearch (and WebFetch on the best result) for each product, model or company the post
  names that you cannot describe with certainty, and for every price, benchmark or date it
  claims. Products released after your knowledge cutoff always need a search.
- One or two searches per post is usually enough; skip research only for off-topic posts.
- Never open facebook.com or fb.watch (RAD-003).
- Put what you learned in `context`, and any mismatch with the post's claim in `factCheck`
  ("Bài nói 2 video 15s tốn $16.2; bảng giá Seedance hiện là $x/giây, tức khoảng $y, khớp.").

## Example

Post: "Tính làm cái video test Seedance 2.5 & ElevenLabs v4, mới tạo 2 videos (15s mỗi video)
là bay $16.2! ... công nhận AI Voice giờ đỉnh thiệt!"

```json
{
  "tldr": "Tác giả thử ghép Seedance 2.5 (video) với ElevenLabs v4 (giọng nói): 2 video 15 giây tốn $16.2, chất lượng giọng AI rất tốt.",
  "context": "- **Seedance 2.5**: model text-to-video của ByteDance, ...\n- **ElevenLabs v4**: model text-to-speech, ...\n- So với Veo và Sora: ...",
  "scoreReason": "Trải nghiệm cá nhân có một con số chi phí thật, hữu ích để ước lượng giá, nhưng không có prompt hay workflow để làm theo. Liên quan vừa phải vì không phải công cụ frontend.",
  "applyNote": "Không cần làm gì lúc này. Nếu sau này cần video demo cho portfolio, chi phí khoảng $0.5 mỗi giây là mốc để so sánh.",
  "signalScore": 3, "contentType": "opinion", "isRelevant": true
}
```

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

## Gaps in the captured data

The capture has text, image stills and links, nothing more. Judge only what is there, and say
what is missing instead of guessing.

- **Reels and videos** (`kind` REEL or VIDEO, or a `video` image): the image is one frame of
  the video, not the video. Score on the text and the frame. If the text alone does not say
  what the video shows, write in `imageNotes` that the video could not be watched, and keep
  `signalScore` at most 4 unless the text itself carries the news.
- **"Link in the comments"**: when `comments.status` is `FETCHED` or `PARTIAL`, look for the link
  in the author's comments. When it is `NOT_FETCHED`, score on the visible text, set
  `wantsComments` to true, and say in `factCheck` that the linked resource was not available,
  naming what the post promised.
- **`ocrText`** is often only a generic caption ("May be an image of text"). Ignore it then and
  read the image itself.
- **Off-topic posts** (memes, jokes, personal life): `isRelevant` false, `signalScore` 0 to 1,
  `applyNote` one line saying there is nothing to do, `imageNotes` null unless an image carries
  information. `context` can be one short bullet.
