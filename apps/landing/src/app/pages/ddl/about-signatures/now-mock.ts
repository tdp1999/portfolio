import type { Locale } from '@portfolio/shared/types';

/**
 * Mock `/now` data for the currently-shipping sandbox. Task 336 spec falls
 * back to **option (b) — structured 4 fields** (`nowBuilding`, `nowWriting`,
 * `nowLearning`, `lastShipped`) until task 328 v2 ships the real content
 * shape. Variants consume this mock as if it were the real service; when
 * `NowService` exists, swap the page-level binding and the variants don't
 * change.
 */
export type NowEntry = {
  readonly building: string;
  readonly writing: string;
  readonly learning: string;
  readonly lastShipped: string;
  /** ISO date — surfaces as "Last updated YYYY-MM-DD" in every variant. */
  readonly lastUpdatedIso: string;
};

const NOW_EN: NowEntry = {
  building:
    'The /about page — splitting work history out of /experience into a deeper "who & proof" surface with sticky-tab roles + manifesto.',
  writing:
    'A short post on why we tore out implicit relation loading at our persistence boundary and what the replacement looks like.',
  learning: 'Cloudflare Workers + Hyperdrive — picking it apart for the next iteration of the landing API edge layer.',
  lastShipped:
    'Contact form pipeline (BE + console + landing) with hardened error handling and bilingual error dictionary.',
  lastUpdatedIso: '2026-05-22',
};

const NOW_VI: NowEntry = {
  building:
    'Trang /about — tách phần lịch sử công việc khỏi /experience thành một surface sâu hơn cho "who & proof", có sticky-tab role + manifesto.',
  writing:
    'Một bài ngắn về lý do gỡ implicit relation loading ở ranh giới persistence và phương án thay thế trông ra sao.',
  learning: 'Cloudflare Workers + Hyperdrive — đang nghiên cứu cho iteration tiếp theo của edge layer landing API.',
  lastShipped:
    'Pipeline contact form (BE + console + landing) với xử lý lỗi đã được tinh chỉnh và từ điển lỗi song ngữ.',
  lastUpdatedIso: '2026-05-22',
};

export function getNowEntry(locale: Locale): NowEntry {
  return locale === 'vi' ? NOW_VI : NOW_EN;
}
