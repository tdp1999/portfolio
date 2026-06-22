import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Eyebrow, Globe, Heading, Link } from '@portfolio/landing/shared/ui';

import { DdlConsidered } from '../ddl-considered/ddl-considered';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { GET_IN_TOUCH_VARIANTS } from './ddl-get-in-touch.data';

/**
 * §07 Get in Touch — direction record (decided).
 *
 * The page is a historical sandbox: the right-column explorations (V1/V2/V3
 * globe variations + a/b/c CV placement) are kept as a record of how the
 * section evolved. The shipped winner is the *centered 3-purpose* direction —
 * the right column was dropped and the globe graduated to /contact.
 *
 * Globe logic + land grid lives in <landing-globe> (shared UI). This page is
 * just composition: decision record → considered mocks.
 */
@Component({
  selector: 'landing-ddl-get-in-touch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Eyebrow, Globe, Heading, Link, DdlDocPage, DdlSection, DdlDecisionRecord, DdlConsidered],
  templateUrl: './ddl-get-in-touch.html',
  styleUrl: './ddl-get-in-touch.scss',
})
export class DdlGetInTouch {
  readonly variants = GET_IN_TOUCH_VARIANTS;
}
