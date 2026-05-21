export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** If set, downstream client uses it as the "Reply-To" header so recipient's reply lands here instead of the from address. */
  replyTo?: string;
}

export interface IEmailService {
  sendEmail(options: SendEmailOptions): Promise<void>;
}
