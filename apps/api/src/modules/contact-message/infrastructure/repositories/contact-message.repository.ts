import { Injectable } from '@nestjs/common';
import { ContactMessageStatus, Prisma } from '@prisma/client';

import { PaginatedResult } from '@portfolio/shared/types';

import {
  ContactMessageFindAllOptions,
  IContactMessageRepository,
} from '../../application/ports/contact-message.repository.port';
import { ContactMessage } from '../../domain/entities/contact-message.entity';
import { PrismaService } from '../../../../infrastructure/prisma';
import { ContactMessageMapper } from '../mapper/contact-message.mapper';

@Injectable()
export class ContactMessageRepository implements IContactMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(entity: ContactMessage): Promise<string> {
    const data = ContactMessageMapper.toPrisma(entity);
    const created = await this.prisma.contactMessage.create({ data });
    return created.id;
  }

  async findById(id: string): Promise<ContactMessage | null> {
    const raw = await this.prisma.contactMessage.findUnique({ where: { id } });
    return raw ? ContactMessageMapper.toDomain(raw) : null;
  }

  async findAll(options: ContactMessageFindAllOptions): Promise<PaginatedResult<ContactMessage>> {
    const { page, limit, search, includeDeleted, status, purpose, includeSpam } = options;
    const where: Prisma.ContactMessageWhereInput = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (!includeSpam) {
      where.isSpam = false;
    }

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (purpose) {
      where.purpose = Array.isArray(purpose) ? { in: purpose } : purpose;
    }

    if (search) {
      // Email is stored in plaintext (not hashed like IP) to enable admin search.
      // This is a conscious privacy trade-off: admins need to find messages by sender.
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      data: data.map(ContactMessageMapper.toDomain),
      total,
    };
  }

  async getUnreadCount(): Promise<number> {
    return this.prisma.contactMessage.count({
      where: {
        status: ContactMessageStatus.UNREAD,
        deletedAt: null,
        isSpam: false,
      },
    });
  }

  async update(id: string, entity: ContactMessage): Promise<void> {
    await this.prisma.contactMessage.update({
      where: { id },
      data: {
        status: entity.status,
        isSpam: entity.isSpam,
        readAt: entity.readAt,
        repliedAt: entity.repliedAt,
        archivedAt: entity.archivedAt,
        deletedAt: entity.deletedAt,
      },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.contactMessage.delete({ where: { id } });
  }

  async hardDeleteExpired(): Promise<number> {
    const result = await this.prisma.contactMessage.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  async hardDeleteOldSoftDeleted(olderThan: Date): Promise<number> {
    const result = await this.prisma.contactMessage.deleteMany({
      where: {
        deletedAt: { not: null, lt: olderThan },
      },
    });
    return result.count;
  }

  async countRecentByEmail(email: string, since: Date): Promise<number> {
    return this.prisma.contactMessage.count({
      where: {
        email,
        createdAt: { gte: since },
      },
    });
  }

  async countRecentByIpHash(ipHash: string, since: Date): Promise<number> {
    return this.prisma.contactMessage.count({
      where: {
        ipAddress: ipHash,
        createdAt: { gte: since },
      },
    });
  }
}
