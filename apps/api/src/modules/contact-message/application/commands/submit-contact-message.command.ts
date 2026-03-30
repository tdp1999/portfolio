import { createHash } from 'crypto';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

import { ValidationError, BadRequestError, ContactMessageErrorCode, ErrorLayer } from '@portfolio/shared/errors';

import { IContactMessageRepository } from '../ports/contact-message.repository.port';
import { CONTACT_MESSAGE_REPOSITORY } from '../contact-message.token';
import { SubmitContactMessageSchema } from '../contact-message.dto';
import { ContactMessage } from '../../domain/entities/contact-message.entity';
import { isDisposableEmail } from '../../infrastructure/utils/disposable-email';
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
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService
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
      const ipHash = createHash('sha256').update(command.ipAddress).digest('hex');
      const ipCount = await this.repo.countRecentByIpHash(ipHash, since);
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

    // Create entity
    const entity = ContactMessage.create({
      name: data.name,
      email: data.email,
      purpose: data.purpose as Parameters<typeof ContactMessage.create>[0]['purpose'],
      subject: data.subject,
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
        subject: data.subject ?? '',
        purpose: data.purpose,
      });
      await this.emailService.sendEmail({
        to: data.email,
        subject: autoReply.subject,
        html: autoReply.bodyHtml,
      });
    } catch (err) {
      this.logger.warn(`Failed to send auto-reply to ${data.email}: ${err}`);
    }

    // Send admin notification (non-blocking)
    try {
      const adminEmail = process.env['ADMIN_NOTIFICATION_EMAIL'];
      if (adminEmail) {
        const consoleUrl = process.env['CONSOLE_URL'] ?? '';
        const notification = this.templateRepo.getTemplate('admin-notification', 'en', {
          name: data.name,
          email: data.email,
          purpose: data.purpose,
          subject: data.subject ?? '',
          message: data.message,
          locale: data.locale,
          consoleUrl: `${consoleUrl}/messages/${id}`,
          messageId: id,
        });
        await this.emailService.sendEmail({
          to: adminEmail,
          subject: notification.subject,
          html: notification.bodyHtml,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to send admin notification: ${err}`);
    }

    return { id };
  }
}
