import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Eyebrow } from '@portfolio/landing/shared/ui';

import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { PHILOSOPHY_STRIP_VARIANTS } from './ddl-philosophy-strip.data';

/**
 * §6b Philosophy strip — direction variants (exploring).
 *
 * The current production strip ([philosophy] = bioShort) is a centered text block
 * that visually merges with §6 Story above and re-says credo content already
 * carried by §3 Bio Card OUTLOOK and §6 Story's italic closing line.
 *
 * Each variant reframes the slot from "third credo restatement" into a structural
 * beat: pause / sign-off / coda. Every variant is rendered inside a
 * Story-tail → variant → CTA-preview sandwich so the transition reads in
 * context, not in isolation. No winner yet — all candidates stay visible.
 */
@Component({
  selector: 'landing-ddl-philosophy-strip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Eyebrow, DdlDocPage, DdlSection, DdlDecisionRecord],
  templateUrl: './ddl-philosophy-strip.html',
  styleUrl: './ddl-philosophy-strip.scss',
})
export class DdlPhilosophyStrip {
  readonly variants = PHILOSOPHY_STRIP_VARIANTS;
}
