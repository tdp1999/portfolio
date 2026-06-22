import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Eyebrow, Icon, IconArrow } from '@portfolio/landing/shared/ui';

import { DdlConsidered } from '../ddl-considered/ddl-considered';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { SAMPLE_CATEGORIES, USES_CARD_VARIANTS } from './ddl-uses-card.data';

@Component({
  selector: 'landing-ddl-uses-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Eyebrow, Icon, IconArrow, DdlDocPage, DdlSection, DdlDecisionRecord, DdlConsidered],
  templateUrl: './ddl-uses-card.html',
  styleUrl: './ddl-uses-card.scss',
})
export class DdlUsesCard {
  readonly categories = SAMPLE_CATEGORIES;
  readonly sampleEntry = SAMPLE_CATEGORIES[0].entries[0];
  readonly variants = USES_CARD_VARIANTS;
}
