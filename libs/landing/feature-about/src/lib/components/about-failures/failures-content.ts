import type { Locale } from '@portfolio/shared/types';

/**
 * Failures & lessons content for the About page. Inline EN + VI for v1 —
 * promote to a markdown loader or `Profile.failures[]` (translatable JSON,
 * console-managed) only when edit cadence proves it's needed. Author replaces
 * these placeholders with real essays in task 340.
 *
 * Anonymization rule applies: no company names — "At a fintech I led",
 * "At a B2B SaaS", etc. Clinical tone: decision → consequence → lesson.
 *
 * Originally lived as a DDL-sandbox file during task 335; graduated to
 * `feature-about` alongside the V1 component when task 337 ran 2026-05-22.
 */
export type FailureEssay = {
  readonly id: 'essay-1' | 'essay-2' | 'essay-3';
  readonly year: string;
  /** Anonymized scope tag — "At a fintech I led", "At a B2B SaaS", etc. */
  readonly context: string;
  /** Specific bad decision — name the tech / pattern, not the company. */
  readonly decision: string;
  /** Outcome — quantified if possible ("cost N weeks of recovery"). */
  readonly consequence: string;
  /** Lesson applied since — concrete, not "I learned to communicate better". */
  readonly lesson: string;
};

const ESSAYS_EN: readonly FailureEssay[] = [
  {
    id: 'essay-1',
    year: '2021',
    context: 'At a B2B SaaS · team of 8',
    decision:
      'Picked the "clever" ORM-magic for a 30-table loan schema because it shaved boilerplate on day one. We leaned on its implicit relation loading everywhere.',
    consequence:
      'Six months in, the N+1 storm under real customer load took the API down twice in one week. Recovery: 5 sprints rewriting hot queries to raw SQL and tearing out the magic.',
    lesson:
      'I now refuse implicit relation loading at the persistence boundary, no matter how slick the API. Explicit joins are cheap; surprising query plans are not.',
  },
  {
    id: 'essay-2',
    year: '2022',
    context: 'At a fintech · I led the FE migration',
    decision:
      'Rolled the design system, framework upgrade, and routing overhaul into a single quarter. The plan looked tight on paper and the calendar said it fit.',
    consequence:
      'One feature freeze for 11 weeks. Stakeholder trust took the bigger hit — not the timeline. The team shipped, but two engineers left during the freeze and the next quarter started under a cloud.',
    lesson:
      'Migrations get their own quarter, on their own. I now split work into independently-deployable slices even when the calendar says I "should" be able to bundle.',
  },
  {
    id: 'essay-3',
    year: '2019',
    context: 'At an agency · team of 3',
    decision:
      'Refactored a tangle of CKEditor wrappers before writing a single characterization test, because the existing code had no tests anyway and the architecture was "obvious".',
    consequence:
      'Three silent regressions in the rich-text save path that took us a week each to find. Two were in client production before anyone noticed.',
    lesson:
      'No refactor without a test pinning down the current behavior — even if the test is ugly. Tests come first, prettier code comes second.',
  },
];

const ESSAYS_VI: readonly FailureEssay[] = [
  {
    id: 'essay-1',
    year: '2021',
    context: 'Tại một SaaS B2B · team 8 người',
    decision:
      'Chọn ORM "thông minh" cho schema 30 bảng loan vì nó tiết kiệm boilerplate ngày đầu. Mình dựa vào implicit relation loading ở mọi nơi.',
    consequence:
      'Sáu tháng sau, bão N+1 dưới tải khách hàng thật làm API sập hai lần trong một tuần. Hồi phục: 5 sprint viết lại các truy vấn nóng bằng raw SQL và gỡ bỏ "phép thuật".',
    lesson:
      'Mình từ chối implicit relation loading ở ranh giới persistence, dù API có ngọt đến đâu. Explicit join rẻ; query plan bất ngờ thì không.',
  },
  {
    id: 'essay-2',
    year: '2022',
    context: 'Tại một fintech · mình lead FE migration',
    decision:
      'Dồn việc làm design system, nâng framework, và refactor routing vào cùng một quý. Kế hoạch trên giấy có vẻ vừa, lịch nói là vừa.',
    consequence:
      'Một đợt feature freeze kéo dài 11 tuần. Niềm tin của stakeholder mất nhiều hơn cả timeline — team ship được, nhưng hai engineer nghỉ trong đợt freeze và quý sau bắt đầu trong bóng tối.',
    lesson:
      'Migration phải có quý riêng, tự đứng. Mình chia việc thành những slice deploy được độc lập, kể cả khi lịch nói là "bundle được".',
  },
  {
    id: 'essay-3',
    year: '2019',
    context: 'Tại một agency · team 3 người',
    decision:
      'Refactor một mớ CKEditor wrapper trước khi viết một dòng characterization test, vì code cũ vốn không có test và architecture trông "rõ ràng".',
    consequence:
      'Ba lần regression ngầm trên đường save rich-text, mỗi lần mất một tuần tìm. Hai trong số đó đã ra production khách hàng trước khi có ai phát hiện.',
    lesson: 'Không refactor khi chưa có test pin hành vi hiện tại — kể cả test xấu xí. Test trước, code đẹp sau.',
  },
];

export function getFailureEssays(locale: Locale): readonly FailureEssay[] {
  return locale === 'vi' ? ESSAYS_VI : ESSAYS_EN;
}
