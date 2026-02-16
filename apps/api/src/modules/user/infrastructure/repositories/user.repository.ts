import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IUserRepository } from '../../application/ports/user.repository.port';
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

  async update(id: string, user: User): Promise<boolean> {
    const data = UserMapper.toPrisma(user);
    const { id: _, ...updateData } = data;
    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return !!updated;
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email } });
    return raw ? UserMapper.toDomain(raw) : null;
  }
}
