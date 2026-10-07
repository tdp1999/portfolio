import 'dotenv/config';

import { Test } from '@nestjs/testing';
import { RadarBriefWriter, RadarWorkStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import { RadarBrief } from '../../domain/entities/radar-brief.entity';
import { PrismaModule, PrismaService } from '../../../../shared/prisma';
import { RadarBriefRepository } from './radar-brief.repository';

const LEASE_MS = 30 * 60 * 1000;
// Rows sit in 1990 so real briefs and posts in the dev database never fall in the test window,
// and the test briefs are always the oldest, so a claim never touches a real one.
const FROM = new Date('1990-01-01T00:00:00Z');
const TO = new Date('1990-01-31T23:59:59.999Z');

describe('RadarBriefRepository (integration)', () => {
  let prisma: PrismaService;
  let repo: RadarBriefRepository;
  const sourceId = IdentifierValue.v7();
  const otherSourceId = IdentifierValue.v7();
  const briefIds: string[] = [];

  const addItem = async (publishedAt: Date, opts: { source?: string; enriched?: boolean } = {}) => {
    const id = IdentifierValue.v7();
    await prisma.radarItem.create({
      data: {
        id,
        sourceId: opts.source ?? sourceId,
        externalId: id,
        provider: 'test',
        permalink: `https://fb.test/${id}`,
        authorName: 'test',
        publishedAt,
        rawPayload: {},
        ...(opts.enriched !== false && {
          enrichment: {
            create: {
              id: IdentifierValue.v7(),
              tldr: 'x',
              contentType: 'NEWS',
              signalScore: 5,
              producerAdapter: 'test',
              producerModel: 'test',
            },
          },
        }),
      },
    });
    return id;
  };

  const addBrief = async (
    createdAt: Date,
    workStatus: RadarWorkStatus,
    leaseExpiresAt: Date | null = null,
    writer: RadarBriefWriter = RadarBriefWriter.WORKER
  ) => {
    const id = IdentifierValue.v7();
    briefIds.push(id);
    await prisma.radarBrief.create({
      data: { id, windowFrom: FROM, windowTo: TO, workStatus, leaseExpiresAt, createdAt, writer },
    });
    return id;
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [RadarBriefRepository],
    }).compile();
    prisma = mod.get(PrismaService);
    repo = mod.get(RadarBriefRepository);
    await prisma.radarSource.createMany({
      data: [sourceId, otherSourceId].map((id) => ({ id, url: `https://fb.test/${id}`, displayName: 'Brief test' })),
    });
  });

  afterAll(async () => {
    await prisma.radarBrief.deleteMany({ where: { id: { in: briefIds } } });
    await prisma.radarSource.deleteMany({ where: { id: { in: [sourceId, otherSourceId] } } });
    await prisma.$disconnect();
  });

  it('should keep both window ends, skip unanalyzed posts and filter by source', async () => {
    const atStart = await addItem(FROM);
    const atEnd = await addItem(TO);
    await addItem(new Date(TO.getTime() + 1));
    await addItem(new Date('1990-01-15T00:00:00Z'), { enriched: false });
    const otherSource = await addItem(new Date('1990-01-15T00:00:00Z'), { source: otherSourceId });

    const one = await repo.windowItemIds({ sourceId, windowFrom: FROM, windowTo: TO });
    const all = await repo.windowItemIds({ sourceId: null, windowFrom: FROM, windowTo: TO });

    expect(one.sort()).toEqual([atStart, atEnd].sort());
    expect(all.sort()).toEqual([atStart, atEnd, otherSource].sort());
  });

  it('should skip a brief under a live lease and hand an expired one out again', async () => {
    const now = new Date();
    const leased = await addBrief(
      new Date('1990-01-01T00:00:00Z'),
      RadarWorkStatus.CLAIMED,
      new Date(now.getTime() + LEASE_MS)
    );
    const pending = await addBrief(new Date('1990-01-02T00:00:00Z'), RadarWorkStatus.PENDING);

    const first = await repo.claim(RadarBriefWriter.WORKER, new Date(now.getTime() + LEASE_MS), now);
    const afterExpiry = await repo.claim(
      RadarBriefWriter.WORKER,
      new Date(now.getTime() + 3 * LEASE_MS),
      new Date(now.getTime() + LEASE_MS + 1000)
    );

    expect(first?.id).toBe(pending);
    expect(afterExpiry?.id).toBe(leased);
  });

  it('should hand an AUTO brief only to the AUTO writer, and give a released one back to the queue', async () => {
    const now = new Date();
    // The AUTO brief is older, so a claim that ignored the writer would take it first.
    const auto = await addBrief(new Date('1989-12-30T00:00:00Z'), RadarWorkStatus.PENDING, null, RadarBriefWriter.AUTO);
    const worker = await addBrief(new Date('1989-12-31T00:00:00Z'), RadarWorkStatus.PENDING);

    const byWorker = await repo.claim(RadarBriefWriter.WORKER, new Date(now.getTime() + LEASE_MS), now);
    const byAuto = await repo.claim(RadarBriefWriter.AUTO, new Date(now.getTime() + LEASE_MS), now);
    await repo.release(auto);

    expect(byWorker?.id).toBe(worker);
    expect(byAuto?.id).toBe(auto);
    expect(await prisma.radarBrief.findUnique({ where: { id: auto } })).toMatchObject({
      workStatus: RadarWorkStatus.PENDING,
      leaseExpiresAt: null,
    });
  });

  it('should save a result only while the brief is still claimed', async () => {
    const claimedId = await addBrief(new Date('1990-01-03T00:00:00Z'), RadarWorkStatus.CLAIMED, new Date());
    const doneId = await addBrief(new Date('1990-01-04T00:00:00Z'), RadarWorkStatus.DONE);
    const written = (id: string) =>
      RadarBrief.load({
        id,
        sourceId: null,
        windowFrom: FROM,
        windowTo: TO,
        body: '',
        itemIds: [],
        workStatus: RadarWorkStatus.CLAIMED,
        leaseExpiresAt: null,
        producer: null,
        writer: RadarBriefWriter.WORKER,
        error: null,
        createdAt: FROM,
      }).complete(`[p](/radar/items/${claimedId})`, [claimedId], { adapter: 'test', model: 'test' });

    expect(await repo.saveResult(written(claimedId))).toBe(true);
    expect(await repo.saveResult(written(doneId))).toBe(false);
  });
});
