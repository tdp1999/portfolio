import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import {
  ADMIN_NOTIFICATION_VARIANTS,
  AUTO_REPLY_VARIANTS,
  EMAIL_TEMPLATES_VARIANTS,
  SAMPLE_ADMIN,
  SAMPLE_AUTO_REPLY,
} from '../email-templates/email-templates.data';

/**
 * /ddl/email-templates — sandbox for the contact-flow transactional emails.
 *
 * Renders 3 variants each for auto-reply (sent to submitter) and admin
 * notification (sent to me). Each variant is dropped into an `<iframe srcdoc>`
 * so its CSS lives in an isolated document — mimics email-client rendering
 * (no inheritance from this page, no host stylesheets, inline-styles only).
 *
 * Picked variants graduate into
 * `apps/api/src/modules/email-template/infrastructure/templates/`. Until then,
 * production stays on V0.
 */
@Component({
  selector: 'landing-ddl-email-templates',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, DdlDecisionRecord],
  templateUrl: './ddl-email-templates.html',
  styleUrl: './ddl-email-templates.scss',
})
export class DdlEmailTemplates {
  protected readonly variants = EMAIL_TEMPLATES_VARIANTS;

  /** Each variant rendered once with its sample data, for the `<iframe srcdoc>` previews. */
  protected readonly autoReplyVariants = AUTO_REPLY_VARIANTS.map((v) => ({ ...v, html: v.render(SAMPLE_AUTO_REPLY) }));
  protected readonly adminVariants = ADMIN_NOTIFICATION_VARIANTS.map((v) => ({ ...v, html: v.render(SAMPLE_ADMIN) }));
}
