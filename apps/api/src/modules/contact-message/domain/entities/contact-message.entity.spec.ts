import { createHash } from 'crypto';

import { ContactMessageStatus, ContactPurpose } from '@prisma/client';
import { validate as validateUuid } from 'uuid';

import { DomainError } from '@portfolio/shared/errors';

import { IContactMessageProps } from '../contact-message.types';

import { ContactMessage } from './contact-message.entity';

const validPayload = {
  name: 'John Doe',
  email: 'john@example.com',
  purpose: ContactPurpose.JOB_OPPORTUNITY,
  subject: 'Hello',
  message: 'I would like to connect.',
  locale: 'en',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  consentGivenAt: new Date('2026-03-29T10:00:00Z'),
};

const loadProps: IContactMessageProps = {
  id: '01234567-89ab-7def-8123-456789abcdef',
  name: 'Jane Doe',
  email: 'jane@example.com',
  purpose: ContactPurpose.GENERAL,
  subject: null,
  message: 'Test message',
  status: ContactMessageStatus.UNREAD,
  isSpam: false,
  ipAddress: 'hashed-ip',
  userAgent: 'TestAgent',
  locale: 'vi',
  consentGivenAt: new Date('2026-03-29T10:00:00Z'),
  createdAt: new Date('2026-03-29T10:00:00Z'),
  readAt: null,
  repliedAt: null,
  archivedAt: null,
  expiresAt: new Date('2027-03-29T10:00:00Z'),
  deletedAt: null,
};

describe('ContactMessage', () => {
  describe('create', () => {
    it('should generate a valid UUID v7', () => {
      const message = ContactMessage.create(validPayload);
      expect(validateUuid(message.id)).toBe(true);
    });

    it('should set status to UNREAD', () => {
      const message = ContactMessage.create(validPayload);
      expect(message.status).toBe(ContactMessageStatus.UNREAD);
    });

    it('should compute expiresAt 12 months ahead', () => {
      const before = Date.now();
      const message = ContactMessage.create(validPayload);
      const after = Date.now();

      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      expect(message.expiresAt.getTime()).toBeGreaterThanOrEqual(before + oneYearMs);
      expect(message.expiresAt.getTime()).toBeLessThanOrEqual(after + oneYearMs);
    });

    it('should hash ipAddress with SHA-256', () => {
      const message = ContactMessage.create(validPayload);
      const expectedHash = createHash('sha256').update('192.168.1.1').digest('hex');
      expect(message.ipAddress).toBe(expectedHash);
    });

    it('should set ipAddress to null when not provided', () => {
      const message = ContactMessage.create({ ...validPayload, ipAddress: undefined });
      expect(message.ipAddress).toBeNull();
    });

    it('should default purpose to GENERAL', () => {
      const message = ContactMessage.create({ ...validPayload, purpose: undefined });
      expect(message.purpose).toBe(ContactPurpose.GENERAL);
    });

    it('should default locale to en', () => {
      const message = ContactMessage.create({ ...validPayload, locale: undefined });
      expect(message.locale).toBe('en');
    });

    it('should set isSpam to false', () => {
      const message = ContactMessage.create(validPayload);
      expect(message.isSpam).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should transition to READ and set readAt', () => {
      const message = ContactMessage.load(loadProps);
      const read = message.markAsRead();

      expect(read.status).toBe(ContactMessageStatus.READ);
      expect(read.readAt).toBeInstanceOf(Date);
      expect(read).not.toBe(message);
      expect(message.status).toBe(ContactMessageStatus.UNREAD);
    });
  });

  describe('markAsUnread', () => {
    it('should transition to UNREAD and clear readAt', () => {
      const message = ContactMessage.load({
        ...loadProps,
        status: ContactMessageStatus.READ,
        readAt: new Date(),
      });
      const unread = message.markAsUnread();

      expect(unread.status).toBe(ContactMessageStatus.UNREAD);
      expect(unread.readAt).toBeNull();
    });
  });

  describe('setReplied', () => {
    it('should transition READ to REPLIED and set repliedAt', () => {
      const message = ContactMessage.load({
        ...loadProps,
        status: ContactMessageStatus.READ,
        readAt: new Date(),
      });
      const replied = message.setReplied();

      expect(replied.status).toBe(ContactMessageStatus.REPLIED);
      expect(replied.repliedAt).toBeInstanceOf(Date);
    });

    it('should throw if status is not READ', () => {
      const message = ContactMessage.load(loadProps); // UNREAD

      let caughtError: unknown;
      try {
        message.setReplied();
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBeInstanceOf(DomainError);
      expect((caughtError as DomainError).message).toContain('not been read');
    });

    it('should throw if status is ARCHIVED', () => {
      const message = ContactMessage.load({
        ...loadProps,
        status: ContactMessageStatus.ARCHIVED,
        archivedAt: new Date(),
      });

      let caughtError: unknown;
      try {
        message.setReplied();
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBeInstanceOf(DomainError);
    });
  });

  describe('archive', () => {
    it('should transition to ARCHIVED and set archivedAt', () => {
      const message = ContactMessage.load(loadProps);
      const archived = message.archive();

      expect(archived.status).toBe(ContactMessageStatus.ARCHIVED);
      expect(archived.archivedAt).toBeInstanceOf(Date);
    });

    it('should throw if already archived', () => {
      const message = ContactMessage.load({
        ...loadProps,
        status: ContactMessageStatus.ARCHIVED,
        archivedAt: new Date(),
      });

      let caughtError: unknown;
      try {
        message.archive();
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBeInstanceOf(DomainError);
      expect((caughtError as DomainError).message).toContain('already archived');
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', () => {
      const message = ContactMessage.load(loadProps);
      const deleted = message.softDelete();

      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.isDeleted).toBe(true);
    });

    it('should throw if already deleted', () => {
      const message = ContactMessage.load({ ...loadProps, deletedAt: new Date() });

      let caughtError: unknown;
      try {
        message.softDelete();
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBeInstanceOf(DomainError);
      expect((caughtError as DomainError).message).toContain('already deleted');
    });
  });

  describe('restore', () => {
    it('should clear deletedAt', () => {
      const message = ContactMessage.load({ ...loadProps, deletedAt: new Date() });
      const restored = message.restore();

      expect(restored.deletedAt).toBeNull();
      expect(restored.isDeleted).toBe(false);
    });

    it('should throw if not deleted', () => {
      const message = ContactMessage.load(loadProps);

      let caughtError: unknown;
      try {
        message.restore();
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBeInstanceOf(DomainError);
      expect((caughtError as DomainError).message).toContain('not deleted');
    });
  });

  describe('markAsSpam / clearSpam', () => {
    it('should toggle isSpam', () => {
      const message = ContactMessage.load(loadProps);

      const spammed = message.markAsSpam();
      expect(spammed.isSpam).toBe(true);

      const cleared = spammed.clearSpam();
      expect(cleared.isSpam).toBe(false);
    });
  });
});
