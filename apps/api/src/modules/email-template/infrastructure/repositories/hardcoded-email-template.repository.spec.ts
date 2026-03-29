import { DomainError } from '@portfolio/shared/errors';

import { HardcodedEmailTemplateRepository } from './hardcoded-email-template.repository';

describe('HardcodedEmailTemplateRepository', () => {
  let repository: HardcodedEmailTemplateRepository;

  beforeEach(() => {
    repository = new HardcodedEmailTemplateRepository();
  });

  describe('getTemplate', () => {
    it('should return contact-auto-reply template in English', () => {
      const result = repository.getTemplate('contact-auto-reply', 'en', {
        name: 'John',
        subject: 'Hello',
        purpose: 'General inquiry',
      });

      expect(result.subject).toContain('John');
      expect(result.bodyHtml).toContain('John');
      expect(result.bodyHtml).toContain('Hello');
      expect(result.bodyText).toContain('John');
      expect(result.bodyText).toContain('General inquiry');
    });

    it('should return contact-auto-reply template in Vietnamese', () => {
      const result = repository.getTemplate('contact-auto-reply', 'vi', {
        name: 'Phong',
        subject: 'Xin chào',
        purpose: 'Hợp tác',
      });

      expect(result.subject).toContain('Phong');
      expect(result.bodyHtml).toContain('Cảm ơn');
      expect(result.bodyHtml).toContain('Phong');
      expect(result.bodyText).toContain('Phong');
      expect(result.bodyText).toContain('Cảm ơn');
    });

    it('should return admin-notification template', () => {
      const result = repository.getTemplate('admin-notification', 'en', {
        name: 'Jane',
        email: 'jane@example.com',
        purpose: 'Hiring',
        subject: 'Job opportunity',
        message: 'We would like to discuss...',
        locale: 'en',
        consoleUrl: 'https://console.example.com/messages/123',
      });

      expect(result.subject).toContain('Job opportunity');
      expect(result.bodyHtml).toContain('Jane');
      expect(result.bodyHtml).toContain('jane@example.com');
      expect(result.bodyHtml).toContain('Hiring');
      expect(result.bodyHtml).toContain('We would like to discuss...');
      expect(result.bodyHtml).toContain('https://console.example.com/messages/123');
      expect(result.bodyText).toContain('Jane');
      expect(result.bodyText).toContain('jane@example.com');
    });

    it('should fall back to English when requested locale is not available', () => {
      const result = repository.getTemplate('admin-notification', 'vi', {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test subject',
        purpose: 'Test',
        message: 'Test message',
        locale: 'vi',
        consoleUrl: 'https://console.example.com/messages/1',
      });

      expect(result.subject).toContain('Test subject');
      expect(result.bodyHtml).toContain('New Contact Message');
    });

    it('should throw NotFoundError when template key does not exist', () => {
      let caughtError: unknown;

      try {
        repository.getTemplate('non-existent', 'en', {});
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBeInstanceOf(DomainError);
      expect((caughtError as DomainError).message).toContain('not found');
    });

    it('should escape HTML in bodyHtml template data', () => {
      const result = repository.getTemplate('contact-auto-reply', 'en', {
        name: '<script>alert("xss")</script>',
        subject: 'Test',
        purpose: 'Test',
      });

      expect(result.bodyHtml).not.toContain('<script>');
      expect(result.bodyHtml).toContain('&lt;script&gt;');
    });

    it('should sanitize subject to prevent header injection', () => {
      const result = repository.getTemplate('contact-auto-reply', 'en', {
        name: 'Evil\r\nBcc: victim@example.com',
        subject: 'Test',
        purpose: 'Test',
      });

      expect(result.subject).not.toContain('\r');
      expect(result.subject).not.toContain('\n');
    });

    it('should sanitize consoleUrl to prevent javascript: XSS', () => {
      const result = repository.getTemplate('admin-notification', 'en', {
        name: 'Test',
        email: 'test@example.com',
        subject: 'Test',
        purpose: 'Test',
        message: 'Test',
        locale: 'en',
        consoleUrl: 'javascript:alert(1)',
      });

      expect(result.bodyHtml).not.toContain('javascript:');
      expect(result.bodyHtml).toContain('href="#"');
    });

    it('should escape single quotes in HTML', () => {
      const result = repository.getTemplate('contact-auto-reply', 'en', {
        name: "O'Brien",
        subject: 'Test',
        purpose: 'Test',
      });

      expect(result.bodyHtml).toContain('O&#39;Brien');
    });
  });

  describe('hasTemplate', () => {
    it('should return true for existing template with exact locale', () => {
      expect(repository.hasTemplate('contact-auto-reply', 'en')).toBe(true);
      expect(repository.hasTemplate('contact-auto-reply', 'vi')).toBe(true);
    });

    it('should return true when locale falls back to English', () => {
      expect(repository.hasTemplate('admin-notification', 'vi')).toBe(true);
    });

    it('should return false for non-existent template key', () => {
      expect(repository.hasTemplate('non-existent', 'en')).toBe(false);
    });
  });
});
