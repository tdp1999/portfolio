import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Input, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, Input],
  templateUrl: './ddl-input.html',
})
export class DdlInput {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Showcase', level: 2 }];
}
