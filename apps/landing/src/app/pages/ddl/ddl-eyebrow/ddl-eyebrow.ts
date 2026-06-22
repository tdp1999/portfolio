import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Eyebrow, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-eyebrow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Eyebrow, DdlDocPage, DdlSection],
  templateUrl: './ddl-eyebrow.html',
})
export class DdlEyebrow {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly usageSnippet = `<landing-eyebrow [label]="['Angular', 'TypeScript']" />`;
}
