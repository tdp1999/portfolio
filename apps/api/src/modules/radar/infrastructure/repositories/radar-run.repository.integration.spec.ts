import 'dotenv/config';

import { Test } from '@nestjs/testing';
import { RadarRunFlow, RadarStatus, RadarStep, RadarWorkStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import { RadarRun } from '../../domain/entities/radar-run.entity';
import { PrismaModule, PrismaService } from '../../../../shared/prisma';
import { RadarRunRepository } from './radar-run.repository';

const MAX_ATTEMPTS = 3;
const { PENDING, RUNNING, DONE, FAILED } = RadarStatus;

/** The guards that keep a cancelled run cancelled live in SQL, so they are checked against Postgres. */
describe('RadarRunRepository (integration)', () => {
  let prisma: PrismaService;
  let repo: RadarRunRepository;
  const sourceId = IdentifierValue.v7();

  const manualRun = () =>
    RadarRun.create({
      sourceId,
      sourceUrl: 'https://fb.test/run',
      sourceName: 'Run test source',
      flow: RadarRunFlow.MANUAL,
      fetchComments: false,
      budgetMicroUsd: null,
      windowFrom: null,
      windowTo: null,
      itemCap: 10,
      adapters: { capture: 'upload', normalize: 'x', enrich: 'x', analyze: 'external-worker' },
    });

  const seedItem = (runId: string, over: { workStatus?: RadarWorkStatus; claimCount?: number } = {}) => {
    const id = IdentifierValue.v7();
    return prisma.radarItem.create({
      data: {
        id,
        sourceId,
        lastRunId: runId,
        externalId: id,
        provider: 'test',
        permalink: `https://fb.test/${id}`,
        authorName: 'test',
        publishedAt: new Date(),
        text: 'x',
        rawPayload: {},
        workStatus: over.workStatus ?? RadarWorkStatus.PENDING,
        claimCount: over.claimCount ?? 0,
      },
    });
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [PrismaModule], providers: [RadarRunRepository] }).compile();
    prisma = mod.get(PrismaService);
    repo = mod.get(RadarRunRepository);
    await prisma.radarSource.create({
      data: { id: sourceId, url: `https://fb.test/${sourceId}`, displayName: 'Run test source' },
    });
  });

  afterEach(async () => {
    await prisma.radarItem.deleteMany({ where: { sourceId } });
    await prisma.radarRun.deleteMany({ where: { sourceId } });
  });

  afterAll(async () => {
    await prisma.radarSource.delete({ where: { id: sourceId } });
    await prisma.$disconnect();
  });

  it('should create one run per source even when two creates race', async () => {
    const results = await Promise.all([repo.add(manualRun()), repo.add(manualRun())]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await prisma.radarRun.count({ where: { sourceId } })).toBe(1);
  });

  it('should leave a cancelled run and its steps untouched by saves from older copies', async () => {
    const run = (await repo.add(manualRun()))!;
    expect(await repo.save(run.cancel(new Date()))).not.toBeNull();

    const writes = await Promise.all([
      repo.save(run.start(new Date())),
      repo.save(run.fail(RadarStep.NORMALIZE, 'later failure', new Date())),
      repo.save(run.completeUpload(new Date(), new Date())),
    ]);

    expect(writes).toEqual([null, null, null]);
    const after = (await repo.findById(run.id))!;
    expect(after).toMatchObject({ status: FAILED, error: 'Cancelled by the Owner' });
    expect(after.steps.map((s) => s.status)).toEqual([FAILED, PENDING, PENDING, PENDING]);
  });

  it('should complete an upload once, and hand the run to image copying', async () => {
    const run = (await repo.add(manualRun()))!;

    const first = await repo.save(run.completeUpload(new Date(), new Date()));
    const second = await repo.save(run.completeUpload(new Date(), new Date()));

    expect([first !== null, second]).toEqual([true, null]);
    const after = (await repo.findById(run.id))!;
    expect(after.status).toBe(RUNNING);
    expect(after.steps.map((s) => s.status)).toEqual([DONE, DONE, RUNNING, PENDING]);
  });

  it('should roll back the run fields of a save whose step was moved by someone else', async () => {
    const run = (await repo.add(manualRun()))!;
    expect(await repo.save(run.completeUpload(new Date(), new Date()))).not.toBeNull();

    // The run guard passes (still active), the CAPTURE guard does not: nothing of this save may land.
    const stale = await repo.save(run.warn('stale warning').completeUpload(new Date(), new Date()));

    expect(stale).toBeNull();
    expect(await prisma.radarRun.findUnique({ where: { id: run.id } })).toMatchObject({ warning: null });
  });

  it('should write only what changed, so the counters a capture page added are kept', async () => {
    const run = (await repo.add(manualRun()))!;
    await prisma.radarRun.update({ where: { id: run.id }, data: { itemsCaptured: 7 } });

    const saved = await repo.save(run.warn('Comments skipped'));

    expect(saved).not.toBeNull();
    expect(await prisma.radarRun.findUnique({ where: { id: run.id } })).toMatchObject({
      itemsCaptured: 7,
      warning: 'Comments skipped',
    });
  });

  it('should count only items the worker can still pick up as not analyzed', async () => {
    const run = (await repo.add(manualRun()))!;
    await seedItem(run.id);
    await seedItem(run.id, { workStatus: RadarWorkStatus.DONE });
    await seedItem(run.id, { claimCount: MAX_ATTEMPTS });

    const counts = await repo.countItems(run.id, new Date(), MAX_ATTEMPTS);

    expect(counts).toMatchObject({ total: 3, notAnalyzed: 1 });
  });
});
