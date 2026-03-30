import { ContactMessageStatus, ContactPurpose } from '@prisma/client';

import { DomainError } from '@portfolio/shared/errors';

import { ContactMessage } from '../../domain/entities/contact-message.entity';
import { IContactMessageRepository } from '../ports/contact-message.repository.port';

import { ListMessagesHandler, ListMessagesQuery } from './list-messages.query';

describe('ListMessagesHandler', () => {
  let handler: ListMessagesHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

  const createMessage = (id: string, overrides: Partial<Record<string, unknown>> = {}) =>
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
      ...overrides,
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

    handler = new ListMessagesHandler(repo);
  });

  it('should return paginated message list', async () => {
    const messages = [createMessage('id-1'), createMessage('id-2')];
    repo.findAll.mockResolvedValue({ data: messages, total: 2 });

    const result = await handler.execute(new ListMessagesQuery({ page: 1, limit: 20 }));

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should pass search parameter', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    await handler.execute(new ListMessagesQuery({ page: 1, limit: 10, search: 'john' }));

    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'john' }));
  });

  it('should pass status filter', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    await handler.execute(new ListMessagesQuery({ page: 1, limit: 10, status: 'UNREAD' }));

    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ status: 'UNREAD' }));
  });

  it('should pass purpose filter', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    await handler.execute(new ListMessagesQuery({ page: 1, limit: 10, purpose: 'JOB_OPPORTUNITY' }));

    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'JOB_OPPORTUNITY' }));
  });

  it('should pass includeDeleted filter', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    await handler.execute(new ListMessagesQuery({ page: 1, limit: 10, includeDeleted: true }));

    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ includeDeleted: true }));
  });

  it('should use defaults for missing params', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    const result = await handler.execute(new ListMessagesQuery({}));

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should reject invalid pagination params', async () => {
    await expect(handler.execute(new ListMessagesQuery({ page: -1 }))).rejects.toBeInstanceOf(DomainError);
  });

  it('should return list item DTOs (not full response)', async () => {
    const messages = [createMessage('id-1')];
    repo.findAll.mockResolvedValue({ data: messages, total: 1 });

    const result = await handler.execute(new ListMessagesQuery({}));

    expect(result.data[0]).toHaveProperty('id');
    expect(result.data[0]).toHaveProperty('name');
    expect(result.data[0]).toHaveProperty('status');
    expect(result.data[0]).not.toHaveProperty('message');
    expect(result.data[0]).not.toHaveProperty('readAt');
  });
});
