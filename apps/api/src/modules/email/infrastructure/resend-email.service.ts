import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { IEmailService, SendEmailOptions } from '../application/email.port';

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly logger = new Logger(ResendEmailService.name);

  constructor() {
    const apiKey = process.env['RESEND_API_KEY'];
    if (!apiKey && process.env['NODE_ENV'] !== 'development') {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    this.resend = new Resend(apiKey);
    this.from = process.env['EMAIL_FROM'] ?? 'noreply@example.com';
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (process.env['NODE_ENV'] === 'development') {
      this.logger.log(`[DEV] Email to=${options.to} subject="${options.subject}"`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}
