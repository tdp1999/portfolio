import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Link, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Link, DdlDocPage, DdlSection],
  templateUrl: './ddl-link.html',
})
export class DdlLink {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly usageSnippet = `<landing-link href="/projects" [arrow]="true">
  Projects
</landing-link>`;
}
