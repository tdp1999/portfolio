import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContainerComponent, LandingBreadcrumbComponent, type BreadcrumbItem } from '@portfolio/landing/shared/ui';
import {
  ADMIN_NOTIFICATION_VARIANTS,
  AUTO_REPLY_VARIANTS,
  SAMPLE_ADMIN,
  SAMPLE_AUTO_REPLY,
  type EmailVariant,
} from './email-templates.data';

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
  selector: 'landing-ddl-email-templates-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, LandingBreadcrumbComponent],
  templateUrl: './email-templates.page.html',
  styleUrl: './email-templates.page.scss',
})
export class EmailTemplatesPage {
  protected readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Email templates' },
  ];

  protected readonly autoReplyVariants = AUTO_REPLY_VARIANTS;
  protected readonly adminVariants = ADMIN_NOTIFICATION_VARIANTS;
  protected readonly autoReplySample = SAMPLE_AUTO_REPLY;
  protected readonly adminSample = SAMPLE_ADMIN;

  protected srcdoc(variant: EmailVariant, sampleKey: 'autoReply' | 'admin'): string {
    const data = sampleKey === 'autoReply' ? this.autoReplySample : this.adminSample;
    return variant.render(data);
  }
}
