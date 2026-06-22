import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Eyebrow, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-section-heading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, Eyebrow],
  templateUrl: './ddl-section-heading.html',
})
export class DdlSectionHeading {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Variants', level: 2 }];
}
