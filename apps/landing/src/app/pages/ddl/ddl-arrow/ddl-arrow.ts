import { ChangeDetectionStrategy, Component } from '@angular/core';

import { IconArrow, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-arrow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconArrow, DdlDocPage, DdlSection],
  templateUrl: './ddl-arrow.html',
  styleUrl: './ddl-arrow.scss',
})
export class DdlArrow {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'prototypes', title: 'Prototypes', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly usageSnippet = `<landing-icon-arrow direction="up-right" [size]="16" />`;
}
