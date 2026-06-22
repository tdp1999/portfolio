import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container, Icon } from '@portfolio/landing/shared/ui';

import { DdlConsidered } from '../ddl-considered/ddl-considered';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { DdlStage } from '../ddl-stage/ddl-stage';
import { ITEMS, MEGA_MENU_VARIANTS } from './ddl-mega-menu.data';
import type { MoreItem } from './ddl-mega-menu.types';

@Component({
  selector: 'landing-ddl-mega-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Icon, DdlDocPage, DdlSection, DdlDecisionRecord, DdlConsidered, DdlStage],
  templateUrl: './ddl-mega-menu.html',
  styleUrl: './ddl-mega-menu.scss',
})
export class DdlMegaMenu {
  // ── Properties ─────────────────────────────────────────────────────
  protected readonly variants = MEGA_MENU_VARIANTS;
  readonly items = ITEMS;
  readonly nonFeatured = ITEMS.filter((i) => !i.featured);
  readonly featured: MoreItem = ITEMS.find((i) => i.featured) ?? ITEMS[0];
}
