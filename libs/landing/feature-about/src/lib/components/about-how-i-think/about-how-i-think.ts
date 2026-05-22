import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingHeadingComponent,
  LandingLocaleService,
  LandingTComponent,
} from '@portfolio/landing/shared/ui';
import type { Locale } from '@portfolio/shared/types';

type Principle = { claim: string; expansion: string };

/**
 * Principles content. Inline per epic Q1 — v1 is hardcoded; promote to
 * `Profile.principles` translatable JSON in a follow-up when console editing
 * is needed. Author voice is stance-driven (no "clean code", "users first",
 * "ship fast" generics); each claim is one assertive line + 2–3 sentence
 * expansion. Add or remove items between 5 and 7 inclusive.
 *
 * VI fallback: when `vi[i]` is missing, the EN entry at index `i` is rendered
 * so the section never breaks during translation lag.
 */
const PRINCIPLES: Record<Locale, readonly Principle[]> = {
  en: [
    {
      claim: 'Complexity is a constraint, not a flex.',
      expansion:
        'Every new abstraction is a promise the next maintainer has to keep. I argue for the boring path first — fewer moving parts, fewer surprises at 3am. If a problem genuinely needs the clever solution, I want the trade-off written down so we can revisit it later without re-running the whole debate.',
    },
    {
      claim: 'Boundaries before abstractions.',
      expansion:
        'Modules earn their seams by carrying real domain meaning, not by satisfying a layering diagram. I treat hexagonal / DDD as a tool for keeping decisions reversible — not as a checklist. When the seam stops paying for itself, the seam goes.',
    },
    {
      claim: 'Tests are conversations, not coverage.',
      expansion:
        'A spec should make next year’s me understand what this code is *supposed* to do — not just that it compiles. I lean hard on integration tests at module seams and value-object tests for invariants; UI snapshots and 100% line targets are rarely worth their maintenance bill.',
    },
    {
      claim: 'The error path is the product.',
      expansion:
        'Most production incidents I have lived through were quiet failure modes: silent retries, swallowed exceptions, "successful" responses with empty payloads. I design the unhappy path with the same care as the happy one — typed errors, explicit recovery, user-facing copy written before the toast component is.',
    },
    {
      claim: 'Ship narrow, iterate honest.',
      expansion:
        'I would rather ship one slice that fully works than five half-features behind flags. After release I look for what the original spec got *wrong* — not just what users tapped — and feed that back into the next slice. Telemetry without a hypothesis is just noise.',
    },
  ],
  vi: [
    {
      claim: 'Độ phức tạp là ràng buộc, không phải thành tích.',
      expansion:
        'Mỗi abstraction mới là một lời hứa người maintainer tiếp theo phải gánh. Mình ưu tiên giải pháp "buồn tẻ" trước — ít mảnh ghép, ít bất ngờ lúc 3 giờ sáng. Nếu vấn đề thật sự cần giải pháp khéo léo, mình muốn trade-off được ghi lại để sau này không phải tranh luận lại từ đầu.',
    },
    {
      claim: 'Đường biên có trước abstraction.',
      expansion:
        'Module xứng đáng có "đường nối" khi nó mang ý nghĩa domain thật sự, không phải để thoả mãn sơ đồ layer. Hexagonal/DDD với mình là công cụ giữ cho quyết định có thể đảo ngược — không phải checklist. Khi đường biên ngừng tạo giá trị, mình gỡ nó đi.',
    },
    {
      claim: 'Test là cuộc trò chuyện, không phải coverage.',
      expansion:
        'Một spec tốt giúp mình của năm sau hiểu code này *đáng lẽ* phải làm gì — không chỉ chứng minh nó compile. Mình dồn lực vào integration test ở các seam module và value-object test cho invariant; UI snapshot và mục tiêu 100% line hiếm khi đáng tiền bảo trì.',
    },
    {
      claim: 'Đường lỗi cũng là sản phẩm.',
      expansion:
        'Phần lớn incident production mình từng gặp đều là "lỗi thầm lặng": retry âm thầm, exception bị nuốt, response "thành công" nhưng payload rỗng. Mình thiết kế unhappy path bằng cùng mức cẩn thận như happy path — error có kiểu, recovery rõ ràng, copy hiển thị cho user được viết trước cả component toast.',
    },
    {
      claim: 'Ship hẹp, iterate trung thực.',
      expansion:
        'Mình thà ship một lát cắt hoàn chỉnh còn hơn năm tính năng dang dở giấu sau flag. Sau release, mình tìm xem spec ban đầu sai chỗ nào — không chỉ là user tap gì — rồi đưa phản hồi vào lát cắt sau. Telemetry không có giả thuyết chỉ là nhiễu.',
    },
  ],
};

@Component({
  selector: 'landing-about-how-i-think',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, EyebrowComponent, LandingHeadingComponent, LandingTComponent],
  templateUrl: './about-how-i-think.html',
  styleUrl: './about-how-i-think.scss',
})
export class LandingAboutHowIThinkComponent {
  private readonly locale = inject(LandingLocaleService).locale;

  /** Localized principle list with English fallback per-item — covers
   *  translation lag without breaking the layout. Index-aligned with `en`. */
  protected readonly principles = computed<readonly (Principle & { number: string })[]>(() => {
    const loc = this.locale();
    const en = PRINCIPLES.en;
    const localized = PRINCIPLES[loc] ?? en;
    return en.map((enItem, i) => {
      const item = localized[i] ?? enItem;
      return {
        claim: item.claim || enItem.claim,
        expansion: item.expansion || enItem.expansion,
        number: String(i + 1).padStart(2, '0'),
      };
    });
  });
}
