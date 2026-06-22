import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container } from '@portfolio/landing/shared/ui';

import { DdlConsidered } from '../ddl-considered/ddl-considered';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import type { DdlVariant } from '../ddl.types';

/**
 * `/ddl/form-input` — DEPRECATED. Historical record of the three early
 * input/textarea visual directions (A/B/C). Direction B (sunken card) was
 * picked and shipped 2026-05-21, then superseded by the full form suite at
 * `/ddl/form-lib` (input · textarea · checkbox · radio · form-field wired
 * through reactive forms). Kept per the DDL-keep-after-graduate rule.
 */
@Component({
  selector: 'landing-ddl-form-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, DdlDocPage, DdlDecisionRecord, DdlConsidered],
  templateUrl: './ddl-form-input.html',
  styleUrl: './ddl-form-input.scss',
})
export class DdlFormInput {
  // ── Decision record (historical) ───────────────────────────────────
  protected readonly variants: readonly DdlVariant[] = [
    {
      id: 'a-hairline',
      label: 'A — Hairline rest, underline focus',
      state: 'rejected',
      note: 'Editorial — transparent bg, bottom border only; underline thickens to accent on focus. Dissolves into the page until touched. Too low-affordance for high-density forms.',
    },
    {
      id: 'b-sunken-card',
      label: 'B — Sunken card',
      selected: true,
      decision:
        'Shipped 2026-05-21 as the production input/textarea primitive. Sunken bg (ink-1 50%), 1px hairline border, 6px radius; border + bg deepen to accent on focus. Reads as a form clearly with a defined affordance. Now superseded by the full suite at /ddl/form-lib.',
    },
    {
      id: 'c-outline-glow',
      label: 'C — Outline + soft accent glow',
      state: 'rejected',
      note: 'Mid-weight — transparent bg, 1.5px hairline; accent border + soft 4px glow on focus. More designed than A, less boxy than B, but the glow added visual noise next to denser controls.',
    },
  ];
}
