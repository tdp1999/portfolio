import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma';
import {
  FindAllOptions,
  FindAllResult,
  IUserRepository,
  UserUpdateData,
} from '../../application/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from '../mapper/user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(user: User): Promise<string> {
    const data = UserMapper.toPrisma(user);
    const created = await this.prisma.user.create({ data });
    return created.id;
  }

  async update(id: string, data: UserUpdateData): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id, deletedAt: null } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email, deletedAt: null } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findAll(options: FindAllOptions): Promise<FindAllResult> {
    const { page, limit, search } = options;
    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map(UserMapper.toDomain),
      total,
    };
  }
}
