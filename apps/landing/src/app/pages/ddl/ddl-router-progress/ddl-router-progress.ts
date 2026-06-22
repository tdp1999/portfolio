import { ChangeDetectionStrategy, Component } from '@angular/core';

import type { InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-router-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection],
  templateUrl: './ddl-router-progress.html',
})
export class DdlRouterProgress {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Showcase', level: 2 }];
}
