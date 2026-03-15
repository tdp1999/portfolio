import { PrismaClient } from '@prisma/client';
import { seedAdmin } from '../prisma/seed';

describe('seedAdmin', () => {
  const mockPrisma: Pick<PrismaClient, 'user'> = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    } as unknown as PrismaClient['user'],
  };

  const validEnv = {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_NAME: 'Admin',
    ADMIN_PASSWORD: 'Valid1Pass@',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create admin user when not exists', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({});

    await seedAdmin(mockPrisma, validEnv);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: validEnv.ADMIN_EMAIL },
    });
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: validEnv.ADMIN_EMAIL,
        name: validEnv.ADMIN_NAME,
        role: 'ADMIN',
      }),
    });
    // Password should be hashed, not plaintext
    const createCall = (mockPrisma.user.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.password).not.toBe(validEnv.ADMIN_PASSWORD);
  });

  it('should skip when admin already exists (idempotent)', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

    await seedAdmin(mockPrisma, validEnv);

    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('should throw when password fails validation', async () => {
    const weakEnv = { ...validEnv, ADMIN_PASSWORD: 'weak' };

    await expect(seedAdmin(mockPrisma, weakEnv)).rejects.toThrow('ADMIN_PASSWORD validation failed');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('should throw when ADMIN_EMAIL is missing', async () => {
    const { ADMIN_EMAIL, ...missingEmail } = validEnv;

    await expect(seedAdmin(mockPrisma, missingEmail)).rejects.toThrow('Missing required environment variables');
  });

  it('should throw when ADMIN_NAME is missing', async () => {
    const { ADMIN_NAME, ...missingName } = validEnv;

    await expect(seedAdmin(mockPrisma, missingName)).rejects.toThrow('Missing required environment variables');
  });

  it('should throw when ADMIN_PASSWORD is missing', async () => {
    const { ADMIN_PASSWORD, ...missingPass } = validEnv;

    await expect(seedAdmin(mockPrisma, missingPass)).rejects.toThrow('Missing required environment variables');
  });
});
