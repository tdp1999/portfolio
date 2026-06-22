import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EmptyState, Link, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, Link, DdlDocPage, DdlSection],
  templateUrl: './ddl-empty-state.html',
})
export class DdlEmptyState {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Showcase', level: 2 }];
}
