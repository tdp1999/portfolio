import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BackLink, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-back-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BackLink, DdlDocPage, DdlSection],
  templateUrl: './ddl-back-link.html',
})
export class DdlBackLink {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Showcase', level: 2 }];
}
