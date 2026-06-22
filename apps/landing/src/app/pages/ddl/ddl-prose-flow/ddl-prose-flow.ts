import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Heading } from '@portfolio/landing/shared/ui';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-prose-flow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, Heading],
  templateUrl: './ddl-prose-flow.html',
  styleUrl: './ddl-prose-flow.scss',
})
export class DdlProseFlow {}
