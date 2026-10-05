import 'dotenv/config';

import { Test } from '@nestjs/testing';

import { PrismaModule, PrismaService } from '../../../../shared/prisma';
import { RadarWorkRepository } from './radar-work.repository';

const LEASE_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 2;
// Far-future publish dates put these items first in the newest-first claim order.
const FUTURE = Date.UTC(2099, 0, 1);

describe('RadarWorkRepository (integration)', () => {
  let prisma: PrismaService;
  let repo: RadarWorkRepository;
  const sourceId = '01a10755-0000-7000-8000-' + String(Date.now()).slice(-12);
  const itemIds = ['a', 'b'].map((s) => `01a10755-0000-7000-8001-${String(Date.now()).slice(-11)}${s}`);

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [PrismaModule], providers: [RadarWorkRepository] }).compile();
    prisma = mod.get(PrismaService);
    repo = mod.get(RadarWorkRepository);
    await prisma.radarSource.create({
      data: { id: sourceId, url: `https://fb.test/${sourceId}`, displayName: 'test' },
    });
    await prisma.radarItem.createMany({
      data: itemIds.map((id, n) => ({
        id,
        sourceId,
        externalId: `${sourceId}-${n}`,
        provider: 'test',
        permalink: `https://fb.test/${id}`,
        authorName: 'test',
        publishedAt: new Date(FUTURE - n * 1000),
        rawPayload: {},
      })),
    });
  });

  afterAll(async () => {
    await prisma.radarSource.deleteMany({ where: { id: sourceId } });
    await prisma.$disconnect();
  });

  it('should skip items under a live lease and hand an expired lease out again (RAD-005)', async () => {
    const now = new Date();

    const first = await repo.claim(1, LEASE_MS, now, MAX_ATTEMPTS);
    const second = await repo.claim(1, LEASE_MS, now, MAX_ATTEMPTS);
    const afterExpiry = await repo.claim(1, LEASE_MS, new Date(now.getTime() + LEASE_MS + 1000), MAX_ATTEMPTS);

    expect(first.map((i) => i.id)).toEqual([itemIds[0]]);
    expect(second.map((i) => i.id)).toEqual([itemIds[1]]);
    expect(afterExpiry.map((i) => i.id)).toEqual([itemIds[0]]);
    const reclaimed = await prisma.radarItem.findUniqueOrThrow({ where: { id: itemIds[0] } });
    expect(reclaimed.claimCount).toBe(2);
  });

  it('should stop handing out an item once it reached the attempt cap', async () => {
    const later = new Date(Date.now() + 3 * LEASE_MS);

    // Item 0 (newest) holds 2 claims, item 1 holds 1; both leases expired, so the cap alone skips item 0.
    const claimed = await repo.claim(1, LEASE_MS, later, MAX_ATTEMPTS);

    expect(claimed.map((i) => i.id)).toEqual([itemIds[1]]);
  });
});
