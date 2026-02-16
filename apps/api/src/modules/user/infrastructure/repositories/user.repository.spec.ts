import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: { user: Record<string, jest.Mock> };

  const mockPrismaUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    passwordHash: '$2b$10$hash',
    name: 'Test User',
    lastLoginAt: null,
    refreshToken: null,
    refreshTokenExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [UserRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(UserRepository);
  });

  describe('add()', () => {
    it('should create a user and return the id', async () => {
      prisma.user.create.mockResolvedValue(mockPrismaUser);
      const user = User.load(mockPrismaUser);

      const id = await repository.add(user);

      expect(id).toBe(mockPrismaUser.id);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: 'test@example.com' }),
      });
    });
  });

  describe('update()', () => {
    it('should update a user and return true', async () => {
      prisma.user.update.mockResolvedValue(mockPrismaUser);
      const user = User.load(mockPrismaUser);

      const result = await repository.update(mockPrismaUser.id, user);

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockPrismaUser.id },
        data: expect.not.objectContaining({ id: expect.anything() }),
      });
    });
  });

  describe('findById()', () => {
    it('should return a domain user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockPrismaUser);

      const user = await repository.findById(mockPrismaUser.id);

      expect(user).toBeInstanceOf(User);
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const user = await repository.findById('non-existent');

      expect(user).toBeNull();
    });
  });

  describe('findByEmail()', () => {
    it('should return a domain user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockPrismaUser);

      const user = await repository.findByEmail('test@example.com');

      expect(user).toBeInstanceOf(User);
      expect(user?.id).toBe(mockPrismaUser.id);
    });

    it('should return null when not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const user = await repository.findByEmail('nope@example.com');

      expect(user).toBeNull();
    });
  });
});
