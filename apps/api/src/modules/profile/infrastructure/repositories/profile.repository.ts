import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma';
import { IProfileRepository, ProfileWithMedia } from '../../application/ports/profile.repository.port';
import { Profile } from '../../domain/entities/profile.entity';
import { ProfileMapper } from '../mapper/profile.mapper';

@Injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const raw = await this.prisma.profile.findUnique({ where: { userId } });
    return raw ? ProfileMapper.toDomain(raw) : null;
  }

  async findOwnerProfile(): Promise<ProfileWithMedia | null> {
    const raw = await this.prisma.profile.findFirst({
      where: { user: { role: 'ADMIN' } },
      orderBy: { user: { createdAt: 'asc' } },
      include: { avatar: true, ogImage: true },
    });
    return raw ? ProfileMapper.toDomainWithMedia(raw) : null;
  }

  async findWithMedia(userId: string): Promise<ProfileWithMedia | null> {
    const raw = await this.prisma.profile.findUnique({
      where: { userId },
      include: { avatar: true, ogImage: true },
    });
    return raw ? ProfileMapper.toDomainWithMedia(raw) : null;
  }

  async upsert(entity: Profile): Promise<string> {
    const data = ProfileMapper.toPrisma(entity);
    const { id, userId, ...fields } = data;
    const result = await this.prisma.profile.upsert({
      where: { userId },
      create: data,
      update: fields,
    });
    return result.id;
  }

  async updateAvatar(userId: string, avatarId: string | null): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { avatarId },
    });
  }

  async updateOgImage(userId: string, ogImageId: string | null): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { ogImageId },
    });
  }
}
