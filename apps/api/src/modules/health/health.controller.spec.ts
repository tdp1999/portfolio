import { Test } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn() };

    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get(HealthController);
  });

  describe('GET /health', () => {
    it('returns status ok with db connected when database is reachable', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await controller.check();

      expect(result).toEqual({
        status: 'ok',
        db: 'connected',
        timestamp: expect.any(String),
      });
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('throws 503 with db error when database is unreachable', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      let caught: HttpException | null = null;
      try {
        await controller.check();
      } catch (e) {
        caught = e as HttpException;
      }

      expect(caught).toBeInstanceOf(HttpException);
      expect(caught!.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(caught!.getResponse()).toMatchObject({
        status: 'ok',
        db: 'error',
        timestamp: expect.any(String),
      });
    });
  });
});
