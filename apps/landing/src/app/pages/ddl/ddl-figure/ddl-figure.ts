import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Figure, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-figure',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Figure, DdlDocPage, DdlSection],
  templateUrl: './ddl-figure.html',
})
export class DdlFigure {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];
}
