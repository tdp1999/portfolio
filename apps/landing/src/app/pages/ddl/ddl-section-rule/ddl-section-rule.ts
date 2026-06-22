import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SectionRule, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-section-rule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionRule, DdlDocPage, DdlSection],
  templateUrl: './ddl-section-rule.html',
})
export class DdlSectionRule {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];
}
