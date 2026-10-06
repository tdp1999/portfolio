import 'dotenv/config';

import { Test } from '@nestjs/testing';
import { RadarRunFlow, RadarStatus, RadarStep, RadarWorkStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import { CreateRunData } from '../../application/ports/radar-run.repository.port';
import { PrismaModule, PrismaService } from '../../../../shared/prisma';
import { RadarRunRepository } from './radar-run.repository';

const MAX_ATTEMPTS = 3;
const { PENDING, RUNNING, AWAITING_EXTERNAL, DONE, FAILED } = RadarStatus;

/** The guards that keep a cancelled run cancelled live in SQL, so they are checked against Postgres. */
describe('RadarRunRepository (integration)', () => {
  let prisma: PrismaService;
  let repo: RadarRunRepository;
  const sourceId = IdentifierValue.v7();

  const manualRun = (): CreateRunData => ({
    id: IdentifierValue.v7(),
    sourceId,
    flow: RadarRunFlow.MANUAL,
    status: AWAITING_EXTERNAL,
    fetchComments: false,
    windowFrom: null,
    windowTo: null,
    itemCap: 10,
    captureAdapter: 'upload',
    llmAdapter: 'external-worker',
    steps: [
      { step: RadarStep.CAPTURE, status: AWAITING_EXTERNAL, adapter: 'upload' },
      { step: RadarStep.NORMALIZE, status: PENDING, adapter: 'x' },
      { step: RadarStep.ENRICH, status: PENDING, adapter: 'x' },
      { step: RadarStep.ANALYZE, status: PENDING, adapter: 'x' },
    ],
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
    const results = await Promise.all([repo.create(manualRun()), repo.create(manualRun())]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await prisma.radarRun.count({ where: { sourceId } })).toBe(1);
  });

  it('should leave a cancelled run and its steps untouched by later writes', async () => {
    const run = (await repo.create(manualRun()))!;
    expect(await repo.fail(run.id, RadarStep.CAPTURE, 'Cancelled by the Owner', new Date())).toBe(true);

    const writes = await Promise.all([
      repo.updateRun(run.id, { status: RUNNING }),
      repo.updateStep(run.id, RadarStep.NORMALIZE, { status: RUNNING }),
      repo.fail(run.id, RadarStep.NORMALIZE, 'later failure', new Date()),
      repo.completeUpload(run.id, new Date(), new Date()),
    ]);

    expect(writes).toEqual([false, false, false, false]);
    const after = (await repo.findById(run.id))!;
    expect(after).toMatchObject({ status: FAILED, error: 'Cancelled by the Owner' });
    expect(after.steps.map((s) => s.status)).toEqual([FAILED, PENDING, PENDING, PENDING]);
  });

  it('should complete an upload once, and hand the run to image copying', async () => {
    const run = (await repo.create(manualRun()))!;

    const [first, second] = [
      await repo.completeUpload(run.id, new Date(), new Date()),
      await repo.completeUpload(run.id, new Date(), new Date()),
    ];

    expect([first, second]).toEqual([true, false]);
    const after = (await repo.findById(run.id))!;
    expect(after.status).toBe(RUNNING);
    expect(after.steps.map((s) => s.status)).toEqual([DONE, DONE, RUNNING, PENDING]);
  });

  it('should count only items the worker can still pick up as not analyzed', async () => {
    const run = (await repo.create(manualRun()))!;
    await seedItem(run.id);
    await seedItem(run.id, { workStatus: RadarWorkStatus.DONE });
    await seedItem(run.id, { claimCount: MAX_ATTEMPTS });

    const counts = await repo.countItems(run.id, new Date(), MAX_ATTEMPTS);

    expect(counts).toMatchObject({ total: 3, notAnalyzed: 1 });
  });
});
