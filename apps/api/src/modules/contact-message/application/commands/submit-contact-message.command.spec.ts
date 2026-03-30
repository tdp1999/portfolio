import { DomainError } from '@portfolio/shared/errors';

import { IContactMessageRepository } from '../ports/contact-message.repository.port';
import { IEmailTemplateRepository } from '../../../email-template';
import { IEmailService } from '../../../email';

import { SubmitContactMessageCommand, SubmitContactMessageHandler } from './submit-contact-message.command';

describe('SubmitContactMessageHandler', () => {
  let handler: SubmitContactMessageHandler;
  let repo: jest.Mocked<IContactMessageRepository>;
  let templateRepo: jest.Mocked<IEmailTemplateRepository>;
  let emailService: jest.Mocked<IEmailService>;
  const originalEnv = process.env;

  const validDto = {
    name: 'John Doe',
    email: 'john@example.com',
    purpose: 'GENERAL',
    subject: 'Hello',
    message: 'This is a valid message with enough content.',
    locale: 'en',
    consentGivenAt: '2026-03-29T10:00:00Z',
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ADMIN_NOTIFICATION_EMAIL: 'admin@example.com',
      CONSOLE_URL: 'https://console.example.com',
    };

    repo = {
      add: jest.fn().mockResolvedValue('generated-id'),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      getUnreadCount: jest.fn(),
      hardDelete: jest.fn(),
      hardDeleteExpired: jest.fn(),
      hardDeleteOldSoftDeleted: jest.fn(),
      countRecentByEmail: jest.fn().mockResolvedValue(0),
      countRecentByIpHash: jest.fn().mockResolvedValue(0),
    };

    templateRepo = {
      getTemplate: jest.fn().mockReturnValue({
        subject: 'Test Subject',
        bodyHtml: '<p>Test</p>',
        bodyText: 'Test',
      }),
      hasTemplate: jest.fn().mockReturnValue(true),
    };

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    handler = new SubmitContactMessageHandler(repo, templateRepo, emailService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should store message and send emails on valid submission', async () => {
    const result = await handler.execute(new SubmitContactMessageCommand(validDto, '192.168.1.1', 'Mozilla/5.0'));

    expect(result.id).toBeDefined();
    expect(repo.add).toHaveBeenCalled();
    expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
  });

  it('should silently accept honeypot submissions without storing or emailing', async () => {
    const result = await handler.execute(new SubmitContactMessageCommand({ ...validDto, website: 'http://spam.com' }));

    expect(result.id).toBeDefined();
    expect(repo.add).not.toHaveBeenCalled();
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('should throw RATE_LIMITED when email count exceeds limit', async () => {
    repo.countRecentByEmail.mockResolvedValue(3);

    let caughtError: unknown;
    try {
      await handler.execute(new SubmitContactMessageCommand(validDto));
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(DomainError);
    expect((caughtError as DomainError).message).toContain('Too many messages');
  });

  it('should throw RATE_LIMITED when IP count exceeds limit', async () => {
    repo.countRecentByIpHash.mockResolvedValue(5);

    let caughtError: unknown;
    try {
      await handler.execute(new SubmitContactMessageCommand(validDto, '192.168.1.1'));
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(DomainError);
    expect((caughtError as DomainError).message).toContain('Too many messages');
  });

  it('should throw DISPOSABLE_EMAIL for disposable email addresses', async () => {
    let caughtError: unknown;
    try {
      await handler.execute(new SubmitContactMessageCommand({ ...validDto, email: 'user@mailinator.com' }));
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(DomainError);
    expect((caughtError as DomainError).message).toContain('Disposable email');
  });

  it('should not block submission when auto-reply email fails', async () => {
    emailService.sendEmail.mockRejectedValueOnce(new Error('SMTP error')).mockResolvedValueOnce(undefined);

    const result = await handler.execute(new SubmitContactMessageCommand(validDto));

    expect(result.id).toBeDefined();
    expect(repo.add).toHaveBeenCalled();
  });

  it('should not block submission when admin notification fails', async () => {
    emailService.sendEmail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('SMTP error'));

    const result = await handler.execute(new SubmitContactMessageCommand(validDto));

    expect(result.id).toBeDefined();
    expect(repo.add).toHaveBeenCalled();
  });

  it('should throw validation error for invalid input', async () => {
    let caughtError: unknown;
    try {
      await handler.execute(new SubmitContactMessageCommand({ name: '' }));
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(DomainError);
  });
});
