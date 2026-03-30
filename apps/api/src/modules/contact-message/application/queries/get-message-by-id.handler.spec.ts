import { ContactMessageStatus, ContactPurpose } from '@prisma/client';

import { DomainError } from '@portfolio/shared/errors';

import { ContactMessage } from '../../domain/entities/contact-message.entity';
import { IContactMessageRepository } from '../ports/contact-message.repository.port';

import { GetMessageByIdHandler, GetMessageByIdQuery } from './get-message-by-id.query';

describe('GetMessageByIdHandler', () => {
  let handler: GetMessageByIdHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  const createMessage = (id: string) =>
    ContactMessage.load({
      id,
      name: 'John Doe',
      email: 'john@example.com',
      purpose: ContactPurpose.GENERAL,
      subject: 'Hello',
      message: 'Test message content',
      status: ContactMessageStatus.UNREAD,
      isSpam: false,
      ipAddress: null,
      userAgent: null,
      locale: 'en',
      consentGivenAt: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01'),
      readAt: null,
      repliedAt: null,
      archivedAt: null,
      expiresAt: new Date('2027-01-01'),
      deletedAt: null,
    });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      getUnreadCount: jest.fn(),
      hardDelete: jest.fn(),
      hardDeleteExpired: jest.fn(),
      hardDeleteOldSoftDeleted: jest.fn(),
      countRecentByEmail: jest.fn(),
      countRecentByIpHash: jest.fn(),
    };

    handler = new GetMessageByIdHandler(repo);
  });

  it('should return full message response when found', async () => {
    const message = createMessage('019579a0-0000-7000-8000-000000000001');
    repo.findById.mockResolvedValue(message);

    const result = await handler.execute(new GetMessageByIdQuery('019579a0-0000-7000-8000-000000000001'));

    expect(result.id).toBe('019579a0-0000-7000-8000-000000000001');
    expect(result.name).toBe('John Doe');
    expect(result.message).toBe('Test message content');
    expect(result).toHaveProperty('readAt');
    expect(result).toHaveProperty('repliedAt');
    expect(result).toHaveProperty('archivedAt');
  });

  it('should throw NOT_FOUND when message does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetMessageByIdQuery('019579a0-0000-7000-8000-000000000001'))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject invalid UUID format', async () => {
    await expect(handler.execute(new GetMessageByIdQuery('not-a-uuid'))).rejects.toBeInstanceOf(DomainError);
  });
});
