import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

import { ContactPurpose } from '@prisma/client';

import { ValidationError, BadRequestError, ContactMessageErrorCode, ErrorLayer } from '@portfolio/shared/errors';

import { IContactMessageRepository } from '../ports/contact-message.repository.port';
import { CONTACT_MESSAGE_REPOSITORY } from '../contact-message.token';
import { SubmitContactMessageSchema } from '../contact-message.dto';
import { ContactMessage, hashIp } from '../../domain/entities/contact-message.entity';
import { isDisposableEmail } from '../../infrastructure/utils/disposable-email';
import { ITurnstileVerifier, TURNSTILE_VERIFIER } from '../ports/turnstile-verifier.port';
import { deriveContactSubject, humanizePurpose } from '../utils/purpose-labels';
import { EMAIL_TEMPLATE_REPOSITORY, IEmailTemplateRepository } from '../../../email-template';
import { EMAIL_SERVICE, IEmailService } from '../../../email';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_EMAILS_PER_HOUR = 3;
const MAX_IP_SUBMISSIONS_PER_HOUR = 5;

export class SubmitContactMessageCommand {
  constructor(
    readonly dto: unknown,
    readonly ipAddress?: string,
    readonly userAgent?: string
  ) {}
}

@CommandHandler(SubmitContactMessageCommand)
export class SubmitContactMessageHandler implements ICommandHandler<SubmitContactMessageCommand> {
  private readonly logger = new Logger(SubmitContactMessageHandler.name);

  constructor(
    @Inject(CONTACT_MESSAGE_REPOSITORY) private readonly repo: IContactMessageRepository,
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templateRepo: IEmailTemplateRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    @Inject(TURNSTILE_VERIFIER) private readonly turnstile: ITurnstileVerifier
  ) {}

  async execute(command: SubmitContactMessageCommand): Promise<{ id: string }> {
    const { success, data, error } = SubmitContactMessageSchema.safeParse(command.dto);
    if (!success) {
      throw ValidationError(error, {
        errorCode: ContactMessageErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Contact message validation failed',
      });
    }

    // Honeypot: silently accept if website field is filled
    if (data.website) {
      return { id: uuidv7() };
    }

    // Turnstile verification (skipped in dev when no secret configured)
    const turnstileOk = await this.turnstile.verify(data.turnstileToken ?? '', command.ipAddress);
    if (!turnstileOk) {
      throw BadRequestError('Bot challenge failed. Please refresh and try again.', {
        errorCode: ContactMessageErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
      });
    }

    // Rate limit: email
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const emailCount = await this.repo.countRecentByEmail(data.email, since);
    if (emailCount >= MAX_EMAILS_PER_HOUR) {
      throw BadRequestError('Too many messages. Please try again later.', {
        errorCode: ContactMessageErrorCode.RATE_LIMITED,
        layer: ErrorLayer.APPLICATION,
      });
    }

    // Rate limit: IP (controller always provides x-forwarded-for or req.ip)
    if (!command.ipAddress) {
      this.logger.warn('No IP address available for rate limiting — skipping IP check');
    }
    if (command.ipAddress) {
      // Same digest the entity uses when persisting `ipAddress`; double-hashing
      // by recomputing here separately would break the rate-limit lookup.
      const ipCount = await this.repo.countRecentByIpHash(hashIp(command.ipAddress), since);
      if (ipCount >= MAX_IP_SUBMISSIONS_PER_HOUR) {
        throw BadRequestError('Too many messages. Please try again later.', {
          errorCode: ContactMessageErrorCode.RATE_LIMITED,
          layer: ErrorLayer.APPLICATION,
        });
      }
    }

    // Disposable email check
    if (isDisposableEmail(data.email)) {
      throw BadRequestError('Disposable email addresses are not allowed.', {
        errorCode: ContactMessageErrorCode.DISPOSABLE_EMAIL,
        layer: ErrorLayer.APPLICATION,
      });
    }

    // Subject is synthesized from purpose + name — the contact form has no
    // subject input, so this gives both emails a consistent inbox-friendly label.
    // Zod's `.default('GENERAL')` guarantees a value post-parse; assertNonNullish
    // for the type narrowing into ContactPurpose.
    const purpose: ContactPurpose = data.purpose;
    const derivedSubject = data.subject?.trim() || deriveContactSubject(purpose, data.name, data.locale);

    // Create entity
    const entity = ContactMessage.create({
      name: data.name,
      email: data.email,
      purpose,
      subject: derivedSubject,
      message: data.message,
      locale: data.locale,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      consentGivenAt: new Date(data.consentGivenAt),
    });

    const id = await this.repo.add(entity);

    // Send auto-reply email (non-blocking)
    try {
      const autoReply = this.templateRepo.getTemplate('contact-auto-reply', data.locale, {
        name: data.name,
        subject: derivedSubject,
        purpose: humanizePurpose(purpose, data.locale),
      });
      await this.emailService.sendEmail({
        to: data.email,
        subject: autoReply.subject,
        html: autoReply.bodyHtml,
      });
    } catch (err) {
      // Log message id only — submitter's email is PII and shouldn't leak to
      // server logs for an operational warning. The full record is on disk.
      this.logger.warn(`Failed to send auto-reply for message ${id}: ${err}`);
    }

    // Send admin notification (non-blocking) — always English for triage consistency.
    try {
      const adminEmail = process.env['ADMIN_NOTIFICATION_EMAIL'];
      if (adminEmail) {
        const consoleUrl = process.env['CONSOLE_URL'] ?? '';
        const notification = this.templateRepo.getTemplate('admin-notification', 'en', {
          name: data.name,
          email: data.email,
          purpose: humanizePurpose(purpose, 'en'),
          subject: derivedSubject,
          message: data.message,
          locale: data.locale,
          consoleUrl: `${consoleUrl}/messages/${id}`,
          messageId: id,
        });
        await this.emailService.sendEmail({
          to: adminEmail,
          subject: notification.subject,
          html: notification.bodyHtml,
          // Hitting "Reply" in the inbox lands a draft addressed to the submitter.
          replyTo: data.email,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to send admin notification: ${err}`);
    }

    return { id };
  }
}
