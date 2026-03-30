import { ContactMessageStatus, ContactPurpose } from '@prisma/client';

import { DomainError } from '@portfolio/shared/errors';

import { ContactMessage } from '../../domain/entities/contact-message.entity';
import { IContactMessageProps } from '../../domain/contact-message.types';
import { IContactMessageRepository } from '../ports/contact-message.repository.port';

import { MarkAsReadCommand, MarkAsReadHandler } from './mark-as-read.command';
import { MarkAsUnreadCommand, MarkAsUnreadHandler } from './mark-as-unread.command';
import { SetRepliedCommand, SetRepliedHandler } from './set-replied.command';
import { ArchiveMessageCommand, ArchiveMessageHandler } from './archive-message.command';
import { SoftDeleteMessageCommand, SoftDeleteMessageHandler } from './soft-delete-message.command';
import { RestoreMessageCommand, RestoreMessageHandler } from './restore-message.command';
import { PurgeExpiredMessagesCommand, PurgeExpiredMessagesHandler } from './purge-expired-messages.command';

const baseProps: IContactMessageProps = {
  id: '019596a0-0000-7000-8000-000000000001',
  name: 'Test User',
  email: 'test@example.com',
  purpose: ContactPurpose.GENERAL,
  subject: 'Test',
  message: 'Test message body.',
  status: ContactMessageStatus.UNREAD,
  isSpam: false,
  ipAddress: 'hashed',
  userAgent: 'TestAgent',
  locale: 'en',
  consentGivenAt: new Date(),
  createdAt: new Date(),
  readAt: null,
  repliedAt: null,
  archivedAt: null,
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  deletedAt: null,
};

function createMockRepo(): jest.Mocked<IContactMessageRepository> {
  return {
    add: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    getUnreadCount: jest.fn(),
    hardDelete: jest.fn(),
    hardDeleteExpired: jest.fn().mockResolvedValue(0),
    hardDeleteOldSoftDeleted: jest.fn().mockResolvedValue(0),
    countRecentByEmail: jest.fn(),
    countRecentByIpHash: jest.fn(),
  };
}

describe('MarkAsReadHandler', () => {
  let handler: MarkAsReadHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new MarkAsReadHandler(repo);
  });

  it('should mark message as read', async () => {
    repo.findById.mockResolvedValue(ContactMessage.load(baseProps));

    await handler.execute(new MarkAsReadCommand(baseProps.id));

    expect(repo.update).toHaveBeenCalledWith(
      baseProps.id,
      expect.objectContaining({ status: ContactMessageStatus.READ })
    );
  });

  it('should throw NOT_FOUND if message does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(handler.execute(new MarkAsReadCommand(baseProps.id))).rejects.toBeInstanceOf(DomainError);
  });
});

describe('MarkAsUnreadHandler', () => {
  let handler: MarkAsUnreadHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new MarkAsUnreadHandler(repo);
  });

  it('should mark message as unread', async () => {
    repo.findById.mockResolvedValue(
      ContactMessage.load({ ...baseProps, status: ContactMessageStatus.READ, readAt: new Date() })
    );

    await handler.execute(new MarkAsUnreadCommand(baseProps.id));

    expect(repo.update).toHaveBeenCalledWith(
      baseProps.id,
      expect.objectContaining({ status: ContactMessageStatus.UNREAD })
    );
  });

  it('should throw NOT_FOUND if message does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(handler.execute(new MarkAsUnreadCommand(baseProps.id))).rejects.toBeInstanceOf(DomainError);
  });
});

describe('SetRepliedHandler', () => {
  let handler: SetRepliedHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new SetRepliedHandler(repo);
  });

  it('should set message as replied when status is READ', async () => {
    repo.findById.mockResolvedValue(
      ContactMessage.load({ ...baseProps, status: ContactMessageStatus.READ, readAt: new Date() })
    );

    await handler.execute(new SetRepliedCommand(baseProps.id));

    expect(repo.update).toHaveBeenCalledWith(
      baseProps.id,
      expect.objectContaining({ status: ContactMessageStatus.REPLIED })
    );
  });

  it('should throw INVALID_TRANSITION when status is not READ', async () => {
    repo.findById.mockResolvedValue(ContactMessage.load(baseProps)); // UNREAD

    await expect(handler.execute(new SetRepliedCommand(baseProps.id))).rejects.toBeInstanceOf(DomainError);
  });
});

describe('ArchiveMessageHandler', () => {
  let handler: ArchiveMessageHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new ArchiveMessageHandler(repo);
  });

  it('should archive message', async () => {
    repo.findById.mockResolvedValue(ContactMessage.load(baseProps));

    await handler.execute(new ArchiveMessageCommand(baseProps.id));

    expect(repo.update).toHaveBeenCalledWith(
      baseProps.id,
      expect.objectContaining({ status: ContactMessageStatus.ARCHIVED })
    );
  });

  it('should throw ALREADY_ARCHIVED when already archived', async () => {
    repo.findById.mockResolvedValue(
      ContactMessage.load({ ...baseProps, status: ContactMessageStatus.ARCHIVED, archivedAt: new Date() })
    );

    await expect(handler.execute(new ArchiveMessageCommand(baseProps.id))).rejects.toBeInstanceOf(DomainError);
  });
});

describe('SoftDeleteMessageHandler', () => {
  let handler: SoftDeleteMessageHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new SoftDeleteMessageHandler(repo);
  });

  it('should soft-delete message', async () => {
    repo.findById.mockResolvedValue(ContactMessage.load(baseProps));

    await handler.execute(new SoftDeleteMessageCommand(baseProps.id));

    expect(repo.update).toHaveBeenCalledWith(baseProps.id, expect.objectContaining({ deletedAt: expect.any(Date) }));
  });

  it('should throw ALREADY_DELETED when already deleted', async () => {
    repo.findById.mockResolvedValue(ContactMessage.load({ ...baseProps, deletedAt: new Date() }));

    await expect(handler.execute(new SoftDeleteMessageCommand(baseProps.id))).rejects.toBeInstanceOf(DomainError);
  });
});

describe('RestoreMessageHandler', () => {
  let handler: RestoreMessageHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new RestoreMessageHandler(repo);
  });

  it('should restore soft-deleted message', async () => {
    repo.findById.mockResolvedValue(ContactMessage.load({ ...baseProps, deletedAt: new Date() }));

    await handler.execute(new RestoreMessageCommand(baseProps.id));

    expect(repo.update).toHaveBeenCalledWith(baseProps.id, expect.objectContaining({ deletedAt: null }));
  });

  it('should throw when message is not deleted', async () => {
    repo.findById.mockResolvedValue(ContactMessage.load(baseProps));

    await expect(handler.execute(new RestoreMessageCommand(baseProps.id))).rejects.toBeInstanceOf(DomainError);
  });
});

describe('PurgeExpiredMessagesHandler', () => {
  let handler: PurgeExpiredMessagesHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  beforeEach(() => {
    repo = createMockRepo();
    handler = new PurgeExpiredMessagesHandler(repo);
  });

  it('should return counts of purged messages', async () => {
    repo.hardDeleteExpired.mockResolvedValue(5);
    repo.hardDeleteOldSoftDeleted.mockResolvedValue(3);

    const result = await handler.execute(new PurgeExpiredMessagesCommand());

    expect(result).toEqual({ expiredCount: 5, softDeletedCount: 3 });
    expect(repo.hardDeleteExpired).toHaveBeenCalled();
    expect(repo.hardDeleteOldSoftDeleted).toHaveBeenCalled();
  });
});
