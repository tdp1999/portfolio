import { ContactMessageStatus, ContactPurpose } from '@prisma/client';

import { ICrudRepository, PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';

import { ContactMessage } from '../../domain/entities/contact-message.entity';

export interface ContactMessageFindAllOptions extends PaginatedQuery {
  status?: ContactMessageStatus | ContactMessageStatus[];
  purpose?: ContactPurpose | ContactPurpose[];
  includeSpam?: boolean;
}

export type IContactMessageRepository = ICrudRepository<ContactMessage> & {
  findAll(options: ContactMessageFindAllOptions): Promise<PaginatedResult<ContactMessage>>;
  update(id: string, entity: ContactMessage): Promise<void>;
  getUnreadCount(): Promise<number>;
  hardDelete(id: string): Promise<void>;
  hardDeleteExpired(): Promise<number>;
  hardDeleteOldSoftDeleted(olderThan: Date): Promise<number>;
  countRecentByEmail(email: string, since: Date): Promise<number>;
  countRecentByIpHash(ipHash: string, since: Date): Promise<number>;
};
