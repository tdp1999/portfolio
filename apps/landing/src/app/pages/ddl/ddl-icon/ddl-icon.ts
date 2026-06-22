import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ICON_PROVIDER, Icon, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, Icon],
  templateUrl: './ddl-icon.html',
})
export class DdlIcon {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Showcase', level: 2 }];

  private readonly iconProvider = inject(ICON_PROVIDER);
  readonly iconNames = this.iconProvider.getSupportedIcons();
}
