import { ChangeDetectionStrategy, Component } from '@angular/core';

import { type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-tokens',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection],
  templateUrl: './ddl-tokens.html',
})
export class DdlTokens {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Showcase', level: 2 }];
}
