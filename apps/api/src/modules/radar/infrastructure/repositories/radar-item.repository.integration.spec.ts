import 'dotenv/config';

import { Test } from '@nestjs/testing';
import { RadarRunKind, RadarStatus, RadarWorkStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import { RadarItemListFilter } from '../../application/ports/radar-item.repository.port';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { PrismaModule, PrismaService } from '../../../../shared/prisma';
import { RadarItemRepository } from './radar-item.repository';

const MAX_ATTEMPTS = 3;
const LEASE_MS = 30 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const BASE = Date.UTC(2099, 0, 1);

type Seed = {
  publishedAt: number;
  text: string;
  workStatus?: RadarWorkStatus;
  claimCount?: number;
  leaseExpiresAt?: Date | null;
  enrichment?: { tldr: string; providerTags: string[]; contentType: string; signalScore: number; isPromo?: boolean };
};

describe('RadarItemRepository (integration)', () => {
  let prisma: PrismaService;
  let repo: RadarItemRepository;
  const activeId = IdentifierValue.v7();
  const inactiveId = IdentifierValue.v7();
  const ids: Record<string, string> = {};

  const seed = async (sourceId: string, key: string, s: Seed) => {
    const id = IdentifierValue.v7();
    ids[key] = id;
    await prisma.radarItem.create({
      data: {
        id,
        sourceId,
        externalId: id,
        provider: 'test',
        permalink: `https://fb.test/${id}`,
        authorName: 'test',
        publishedAt: new Date(s.publishedAt),
        text: s.text,
        rawPayload: {},
        workStatus: s.workStatus ?? (s.enrichment ? RadarWorkStatus.DONE : RadarWorkStatus.PENDING),
        claimCount: s.claimCount ?? 0,
        leaseExpiresAt: s.leaseExpiresAt ?? null,
        enrichment: s.enrichment && {
          create: {
            id: IdentifierValue.v7(),
            isPromo: false,
            isRelevant: true,
            producerAdapter: 'test',
            producerModel: 'test',
            ...s.enrichment,
          },
        },
      },
    });
  };

  const list = (f: Partial<RadarItemListFilter> = {}, now = new Date()) =>
    repo.list(
      {
        page: 1,
        limit: 50,
        includePromo: false,
        sourceId: activeId,
        sortBy: 'publishedAt',
        sortDir: 'desc',
        ...f,
      },
      now,
      MAX_ATTEMPTS
    );

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [PrismaModule], providers: [RadarItemRepository] }).compile();
    prisma = mod.get(PrismaService);
    repo = mod.get(RadarItemRepository);
    await prisma.radarSource.createMany({
      data: [
        { id: activeId, url: `https://fb.test/${activeId}`, displayName: 'Active source' },
        { id: inactiveId, url: `https://fb.test/${inactiveId}`, displayName: 'Paused source', isActive: false },
      ],
    });
    await seed(activeId, 'claude', {
      publishedAt: BASE,
      text: 'Claude Code ships hooks',
      enrichment: { tldr: 'Anthropic adds hooks', providerTags: ['anthropic'], contentType: 'tool', signalScore: 8 },
    });
    await seed(activeId, 'gpt', {
      publishedAt: BASE - DAY,
      text: 'New GPT benchmark',
      enrichment: { tldr: 'OpenAI tops a benchmark', providerTags: ['openai'], contentType: 'news', signalScore: 5 },
    });
    await seed(activeId, 'course', {
      publishedAt: BASE - 2 * DAY,
      text: 'Join my course',
      enrichment: {
        tldr: 'Course sale',
        providerTags: ['other'],
        contentType: 'promo',
        signalScore: 1,
        isPromo: true,
      },
    });
    await seed(activeId, 'raw', { publishedAt: BASE - 3 * DAY, text: 'Unread post about Gemini' });
  });

  afterAll(async () => {
    await prisma.radarSource.deleteMany({ where: { id: { in: [activeId, inactiveId] } } });
    await prisma.$disconnect();
  });

  describe('list', () => {
    it('should return items newest first, hide promo by default and keep unenriched items', async () => {
      const result = await list();

      expect(result.data.map((r) => r.id)).toEqual([ids['claude'], ids['gpt'], ids['raw']]);
      expect(result.total).toBe(3);
      expect(result.data[0].source).toEqual({
        id: activeId,
        displayName: 'Active source',
        isActive: true,
        platform: 'FACEBOOK',
      });
      expect(result.data[0].enrichment).toMatchObject({ tldr: 'Anthropic adds hooks', signalScore: 8 });
      expect(result.data[2].enrichment).toBeNull();
    });

    it('should include promo items when asked', async () => {
      const result = await list({ includePromo: true });

      expect(result.data.map((r) => r.id)).toContain(ids['course']);
    });

    it('should filter by provider tag, content type and minimum score', async () => {
      expect((await list({ providerTag: 'openai' })).data.map((r) => r.id)).toEqual([ids['gpt']]);
      expect((await list({ contentType: 'tool' })).data.map((r) => r.id)).toEqual([ids['claude']]);
      expect((await list({ minScore: 6 })).data.map((r) => r.id)).toEqual([ids['claude']]);
    });

    it('should search post text and TL;DR, case-insensitively', async () => {
      expect((await list({ search: 'gemini' })).data.map((r) => r.id)).toEqual([ids['raw']]);
      expect((await list({ search: 'TOPS A BENCH' })).data.map((r) => r.id)).toEqual([ids['gpt']]);
    });

    it('should sort by signal score with unanalyzed items last in both directions', async () => {
      const desc = await list({ sortBy: 'signalScore', sortDir: 'desc' });
      const asc = await list({ sortBy: 'signalScore', sortDir: 'asc' });

      expect(desc.data.map((r) => r.id)).toEqual([ids['claude'], ids['gpt'], ids['raw']]);
      expect(asc.data.map((r) => r.id)).toEqual([ids['gpt'], ids['claude'], ids['raw']]);
    });

    it('should sort oldest first when asked', async () => {
      const result = await list({ sortDir: 'asc' });

      expect(result.data.map((r) => r.id)).toEqual([ids['raw'], ids['gpt'], ids['claude']]);
    });

    it('should paginate with an exact total', async () => {
      const page2 = await list({ page: 2, limit: 2 });

      expect(page2.data.map((r) => r.id)).toEqual([ids['raw']]);
      expect(page2.total).toBe(3);
    });
  });

  describe('list by run', () => {
    it('should return only the posts whose last run is the asked run', async () => {
      const run = await prisma.radarRun.create({
        data: {
          id: IdentifierValue.v7(),
          sourceId: activeId,
          status: RadarStatus.DONE,
          itemCap: 10,
          captureAdapter: 'apify',
          llmAdapter: 'external-worker',
        },
      });
      await prisma.radarItem.updateMany({
        where: { id: { in: [ids['gpt'], ids['course']] } },
        data: { lastRunId: run.id },
      });

      const result = await list({ sourceId: undefined, runId: run.id, includePromo: true });

      expect(result.data.map((r) => r.id)).toEqual([ids['gpt'], ids['course']]);
    });
  });

  describe('findById', () => {
    it('should return the full item with its enrichment', async () => {
      const item = await repo.findById(ids['claude']);

      expect(item).toMatchObject({ id: ids['claude'], text: 'Claude Code ships hooks', media: [], links: [] });
      expect(item?.enrichment).toMatchObject({ tldr: 'Anthropic adds hooks', applyNote: null, linkSummaries: [] });
    });

    it('should return null for an unknown id', async () => {
      expect(await repo.findById(IdentifierValue.v7())).toBeNull();
    });
  });

  describe('stats and requeueStuck', () => {
    it('should count stuck and paused items and re-queue only the stuck ones of active sources', async () => {
      const now = new Date();
      const before = await repo.stats(now, MAX_ATTEMPTS);
      const expired = new Date(now.getTime() - 1000);
      const live = new Date(now.getTime() + LEASE_MS);
      const claimed = { workStatus: RadarWorkStatus.CLAIMED, claimCount: MAX_ATTEMPTS };
      await seed(activeId, 'stuck', {
        publishedAt: BASE - 4 * DAY,
        text: 'stuck',
        ...claimed,
        leaseExpiresAt: expired,
      });
      // Third claim still under its lease: the worker may still submit, so it is not stuck yet.
      await seed(activeId, 'leased', { publishedAt: BASE - 5 * DAY, text: 'leased', ...claimed, leaseExpiresAt: live });
      await seed(inactiveId, 'paused', { publishedAt: BASE - 6 * DAY, text: 'paused' });
      await seed(inactiveId, 'pausedStuck', {
        publishedAt: BASE - 7 * DAY,
        text: 'paused and stuck',
        ...claimed,
        leaseExpiresAt: expired,
      });

      const after = await repo.stats(now, MAX_ATTEMPTS);
      expect(after.stuck - before.stuck).toBe(1);
      expect(after.paused - before.paused).toBe(2);
      // `raw` was seeded before `before`; only `leased` is new pending work.
      expect(after.pending - before.pending).toBe(1);

      // The status filter returns exactly the buckets the counts describe.
      const byStatus = async (status: RadarItemListFilter['status'], sourceId = activeId) =>
        (await list({ status, sourceId, includePromo: true }, now)).data.map((r) => r.id);
      expect(await byStatus('stuck')).toEqual([ids['stuck']]);
      expect(await byStatus('pending')).toEqual([ids['raw'], ids['leased']]);
      expect(await byStatus('analyzed')).toEqual([ids['claude'], ids['gpt'], ids['course']]);
      expect(await byStatus('paused', inactiveId)).toEqual([ids['paused'], ids['pausedStuck']]);

      const requeued = await repo.requeueStuck(now, MAX_ATTEMPTS);

      expect(requeued).toBeGreaterThanOrEqual(1);
      const rows = await prisma.radarItem.findMany({
        where: { id: { in: [ids['stuck'], ids['leased'], ids['pausedStuck']] } },
        select: { id: true, workStatus: true, claimCount: true, leaseExpiresAt: true },
      });
      const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
      expect(byId[ids['stuck']]).toMatchObject({ workStatus: 'PENDING', claimCount: 0, leaseExpiresAt: null });
      expect(byId[ids['leased']]).toMatchObject({ workStatus: 'CLAIMED', claimCount: MAX_ATTEMPTS });
      expect(byId[ids['pausedStuck']]).toMatchObject({ workStatus: 'CLAIMED', claimCount: MAX_ATTEMPTS });
      expect((await repo.stats(now, MAX_ATTEMPTS)).stuck).toBe(0);
    });
  });

  describe('requeueForAnalysis', () => {
    const reanalysis = (count: number) =>
      RadarRun.reanalyze({ itemCount: count, budgetMicroUsd: 1_000_000, analyzeAdapter: 'server-ai' });

    it('should reset the eligible items into one new run and skip the leased, the busy, the paused and the unknown', async () => {
      const now = new Date();
      const busyRun = await prisma.radarRun.create({
        data: {
          id: IdentifierValue.v7(),
          sourceId: activeId,
          status: RadarStatus.RUNNING,
          itemCap: 10,
          captureAdapter: 'apify',
          llmAdapter: 'server-ai',
        },
      });
      await seed(activeId, 'redo', {
        publishedAt: BASE - 8 * DAY,
        text: 'analyzed, failed once since',
        workStatus: RadarWorkStatus.DONE,
        claimCount: 2,
      });
      await prisma.radarItem.update({ where: { id: ids['redo'] }, data: { workError: 'old error' } });
      await seed(activeId, 'expiredLease', {
        publishedAt: BASE - 9 * DAY,
        text: 'lease ran out',
        workStatus: RadarWorkStatus.CLAIMED,
        claimCount: 1,
        leaseExpiresAt: new Date(now.getTime() - 1000),
      });
      await seed(activeId, 'liveLease', {
        publishedAt: BASE - 10 * DAY,
        text: 'worker still holds it',
        workStatus: RadarWorkStatus.CLAIMED,
        claimCount: 1,
        leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
      });
      await seed(activeId, 'inBusyRun', { publishedAt: BASE - 11 * DAY, text: 'its run will analyze it' });
      await prisma.radarItem.update({ where: { id: ids['inBusyRun'] }, data: { lastRunId: busyRun.id } });
      await seed(inactiveId, 'pausedRedo', {
        publishedAt: BASE - 12 * DAY,
        text: 'paused source',
        workStatus: RadarWorkStatus.DONE,
      });
      const asked = [
        ids['redo'],
        ids['expiredLease'],
        ids['liveLease'],
        ids['inBusyRun'],
        ids['pausedRedo'],
        IdentifierValue.v7(),
      ];

      const { requeued, run } = await repo.requeueForAnalysis(asked, now, reanalysis);

      try {
        expect(requeued).toBe(2);
        expect([run?.kind, run?.itemCap]).toEqual([RadarRunKind.REANALYZE, 2]);
        const rows = await prisma.radarItem.findMany({
          where: { id: { in: asked } },
          select: {
            id: true,
            workStatus: true,
            claimCount: true,
            leaseExpiresAt: true,
            workError: true,
            lastRunId: true,
          },
        });
        const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
        const reset = {
          workStatus: 'PENDING',
          claimCount: 0,
          leaseExpiresAt: null,
          workError: null,
          lastRunId: run?.id,
        };
        expect(byId[ids['redo']]).toMatchObject(reset);
        expect(byId[ids['expiredLease']]).toMatchObject(reset);
        expect(byId[ids['liveLease']]).toMatchObject({ workStatus: 'CLAIMED', lastRunId: null });
        expect(byId[ids['inBusyRun']]).toMatchObject({ lastRunId: busyRun.id });
        expect(byId[ids['pausedRedo']]).toMatchObject({ workStatus: 'DONE', lastRunId: null });
      } finally {
        await prisma.radarRun.deleteMany({ where: { id: { in: [busyRun.id, ...(run ? [run.id] : [])] } } });
      }
    });

    it('should create no run when no item is eligible', async () => {
      const before = await prisma.radarRun.count();

      const result = await repo.requeueForAnalysis([IdentifierValue.v7()], new Date(), reanalysis);

      expect(result).toEqual({ requeued: 0, run: null });
      expect(await prisma.radarRun.count()).toBe(before);
    });
  });
});
