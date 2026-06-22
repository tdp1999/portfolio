import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Container, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, DdlDocPage, DdlSection],
  templateUrl: './ddl-container.html',
})
export class DdlContainer {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Showcase', level: 2 }];
}
