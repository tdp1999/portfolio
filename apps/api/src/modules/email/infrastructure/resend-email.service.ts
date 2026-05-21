import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { IEmailService, SendEmailOptions } from '../application/email.port';

/**
 * `RESEND_API_KEY` is treated as "real" when it's set and doesn't match an
 * obvious placeholder. With a real key we always attempt to send (dev or prod);
 * with a missing/placeholder key we log the email and return — so local dev
 * can opt-in to real sending just by setting the env var.
 */
function isRealResendApiKey(apiKey: string | undefined): apiKey is string {
  if (!apiKey) return false;
  if (apiKey === 're_dev_placeholder') return false;
  if (apiKey.includes('xxxx')) return false; // catches .env.example "re_xxxxxxxxxxxx"
  return apiKey.startsWith('re_');
}

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly isLive: boolean;
  private readonly logger = new Logger(ResendEmailService.name);

  constructor() {
    const apiKey = process.env['RESEND_API_KEY'];
    this.isLive = isRealResendApiKey(apiKey);
    if (!this.isLive && process.env['NODE_ENV'] === 'production') {
      throw new Error('RESEND_API_KEY environment variable is required in production');
    }
    this.resend = new Resend(this.isLive ? apiKey : 're_dev_placeholder');
    this.from = process.env['EMAIL_FROM'] ?? 'noreply@example.com';
    if (!this.isLive) {
      this.logger.warn('Resend API key not configured — emails will be logged, not sent.');
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.isLive) {
      this.logger.log(`[DEV] Email to=${options.to} subject="${options.subject}" (not sent — placeholder key)`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    });

    if (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}
