import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DdlDocPage } from './ddl-doc-page/ddl-doc-page';
import { DdlSection } from './ddl-section/ddl-section';

// DDL Overview — the docs home. Reachable from the "Overview" link at the top of
// the left sidebar. Uses the same doc-page shell as every other page (header,
// padding, section rhythm, auto TOC) via header overrides — it just has no
// registry entry, so no status chip / pager.
@Component({
  selector: 'landing-ddl',
  standalone: true,
  imports: [DdlDocPage, DdlSection],
  templateUrl: './ddl.html',
  styleUrl: './ddl.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ddl {}
