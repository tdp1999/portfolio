import { IContactMessageRepository } from '../ports/contact-message.repository.port';

import { GetUnreadCountHandler, GetUnreadCountQuery } from './get-unread-count.query';

describe('GetUnreadCountHandler', () => {
  let handler: GetUnreadCountHandler;
  let repo: jest.Mocked<IContactMessageRepository>;

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

    handler = new GetUnreadCountHandler(repo);
  });

  it('should return unread count', async () => {
    repo.getUnreadCount.mockResolvedValue(5);

    const result = await handler.execute(new GetUnreadCountQuery());

    expect(result).toEqual({ unreadCount: 5 });
    expect(repo.getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('should return zero when no unread messages', async () => {
    repo.getUnreadCount.mockResolvedValue(0);

    const result = await handler.execute(new GetUnreadCountQuery());

    expect(result).toEqual({ unreadCount: 0 });
  });
});
