import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('db')
  async checkDb() {
    const timestamp = new Date().toISOString();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected', timestamp };
    } catch {
      // Infrastructure exception — health check is exempt from "no throws in controllers" rule
      throw new HttpException({ status: 'error', db: 'error', timestamp }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
