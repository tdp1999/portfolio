# Enrichment guide

How to write one Radar enrichment. The rules for every field (language, overview, comments,
research, signal score, apply note, shared posts, gaps in the captured data) live in one place,
shared with the server analysis of AUTO runs:

`apps/api/src/modules/radar/application/prompts/radar-analysis.rules.ts`

Read that file once per session before the first batch and follow it exactly. The API validates
the shape with `apps/api/src/modules/radar/application/radar-enrichment.schema.ts`. This page
only adds what differs for you, the `/radar work` worker.

## Fields only the worker fills

| Field | Rule |
| --- | --- |
| `producer` | `{ "adapter": "claude-code", "model": "<your exact model id from the system prompt>" }` |
| `schemaVersion` | `3` |
| `sources` | Optional (defaults to empty), but fill it whenever you researched: every page you relied on, `{ "url", "title" }`, at most 20, `http(s)` only, never a facebook.com link. A `major` fact check needs the page that shows it here. |

## Tools

Where the rules say "web search" and "the URL tool", use WebSearch and WebFetch. You have no
fixed search limit; two or three searches per post is usually enough, one of them on the main
alternatives or the trend. Images come from `radar-api.sh images` (Read each file), not from
URLs in the claim. Never open facebook.com or fb.watch (RAD-003).

A video item carries `video: { durationSec, transcriptStatus, transcript, transcriptError }`.
The transcript exists only when an AUTO run made it; read it as part of the post. Never download
or watch the video yourself: without a `DONE` transcript, follow the rules' gap bullet for reels.
A YouTube item (permalink on youtube.com) is a whole video: its text is the title, a blank line,
then the description, and its one image is the thumbnail. A YouTube permalink may be opened with
WebFetch for the page text; it never needs a login.

## Example

Post: "Tính làm cái video test Seedance 2.5 & ElevenLabs v4, mới tạo 2 videos (15s mỗi video)
là bay $16.2! ... công nhận AI Voice giờ đỉnh thiệt!"

```json
{
  "tldr": "Tác giả thử ghép Seedance 2.5 (video) với ElevenLabs v4 (giọng nói): 2 video 15 giây tốn $16.2, chất lượng giọng AI rất tốt.",
  "overview": "Tác giả ghép hai model thương mại để làm video có giọng nói và báo chi phí thật: $16.2 cho 30 giây, tức khoảng $0.5 mỗi giây.\n\nĐiều này cho thấy video AI có tiếng đã dùng được cho demo ngắn, nhưng còn đắt nếu làm nhiều. Giọng nói (ElevenLabs) đã gần như tự nhiên, phần hình (Seedance) là chỗ tốn tiền nhất.\n\nTrong bức tranh chung, Seedance cạnh tranh với Veo của Google và Sora của OpenAI; giá theo giây của cả ba đều đang giảm qua mỗi phiên bản ...\n\nGiới hạn: chỉ là một lần thử, không có prompt, không so chất lượng giữa các model.\n\nNên theo dõi: bảng giá Seedance và Veo trong các bản tới.",
  "context": "- **Seedance 2.5**: model text-to-video của ByteDance.\n- **ElevenLabs v4**: model text-to-speech của ElevenLabs.",
  "factCheck": null, "factCheckSeverity": null,
  "scoreReason": "Trải nghiệm cá nhân có một con số chi phí thật, hữu ích để ước lượng giá, nhưng không có prompt hay workflow để làm theo. Liên quan vừa phải vì không phải công cụ frontend.",
  "applyNote": "Không cần làm gì lúc này. Nếu sau này cần video demo cho portfolio, chi phí khoảng $0.5 mỗi giây là mốc để so sánh.",
  "signalScore": 3, "contentType": "opinion", "isRelevant": true
}
```
