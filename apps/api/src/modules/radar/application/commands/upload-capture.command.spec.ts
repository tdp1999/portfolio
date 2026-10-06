import { CommandBus } from '@nestjs/cqrs';
import { RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

import { RadarSource } from '../../domain/entities/radar-source.entity';
import { MulterFile } from '../../../../shared/types';
import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { ApifyFacebookNormalizer } from '../../infrastructure/capture/apify-facebook.normalizer';
import { IRadarCaptureRepository, SaveCaptureResult } from '../ports/radar-capture.repository.port';
import { radarRun } from '../../domain/__fixtures__/radar-run.fixture';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { PersistItemImagesCommand } from './persist-item-images.command';
import { UploadCaptureCommand, UploadCaptureHandler } from './upload-capture.command';

const source = (isActive = true) =>
  RadarSource.load({
    id: SOURCE_ID,
    platform: 'FACEBOOK',
    url: 'https://fb.test/s',
    displayName: 's',
    isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const SOURCE_ID = '01a10755-fd0d-700c-af4f-05a7a675700e';
const RUN_ID = '01a10b5b-9d90-753e-a6a3-000000000001';
const POST = { postId: '1', url: 'https://www.facebook.com/x/posts/1', time: '2026-08-14T11:41:03.000Z', text: 'hi' };

const file = (content: unknown): MulterFile => ({
  buffer: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)),
  originalname: 'posts.json',
  mimetype: 'application/json',
});

/** `completes: false` is a run cancelled (or filled by another upload) between the check and the write. */
type WaitingRun = { flow: RadarRunFlow; captureStatus: RadarStatus; itemCap: number; completes?: boolean };

const setup = (
  opts: { isActive?: boolean; saved?: Partial<SaveCaptureResult>; run?: WaitingRun; activeRun?: boolean } = {}
) => {
  const sources = {
    findById: jest.fn(async () => source(opts.isActive ?? true)),
  } as unknown as IRadarSourceRepository;
  const captures = {
    saveCapture: jest.fn(async () => ({ created: 1, updated: 0, orphanedImageIds: [], ...opts.saved })),
    saveCapturePage: jest.fn(async () => ({ created: 1, updated: 0, orphanedImageIds: [] })),
  } satisfies IRadarCaptureRepository;
  const run = opts.run;
  const runs = {
    findById: jest.fn(async () =>
      run
        ? radarRun(
            {
              id: RUN_ID,
              sourceId: SOURCE_ID,
              flow: run.flow,
              itemCap: run.itemCap,
              status: RadarStatus.AWAITING_EXTERNAL,
            },
            { [RadarStep.CAPTURE]: { status: run.captureStatus } }
          )
        : null
    ),
    hasActiveRun: jest.fn(async () => opts.activeRun ?? false),
    save: jest.fn(async (next: RadarRun) => (run?.completes === false ? null : RadarRun.load(next.toProps()))),
  } as unknown as jest.Mocked<IRadarRunRepository>;
  const commandBus = { execute: jest.fn(async () => undefined) } as unknown as jest.Mocked<CommandBus>;
  const storage = { delete: jest.fn(async () => undefined) } as unknown as jest.Mocked<IStorageService>;
  const handler = new UploadCaptureHandler(
    commandBus,
    sources,
    captures,
    runs,
    [new ApifyFacebookNormalizer()],
    storage
  );
  return { handler, captures, runs, commandBus, storage };
};

describe('UploadCaptureHandler', () => {
  it('should reject a file that is not a JSON array of posts and write nothing', async () => {
    const { handler, captures } = setup();

    for (const content of ['not json', { posts: [] }, []]) {
      await expect(handler.execute(new UploadCaptureCommand(SOURCE_ID, file(content), {}))).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'RADAR_INVALID_UPLOAD',
      });
    }
    expect(captures.saveCapture).not.toHaveBeenCalled();
  });

  it('should refuse uploads to an inactive source', async () => {
    const { handler, captures } = setup({ isActive: false });

    await expect(handler.execute(new UploadCaptureCommand(SOURCE_ID, file([POST]), {}))).rejects.toMatchObject({
      errorCode: 'RADAR_SOURCE_INACTIVE',
    });
    expect(captures.saveCapture).not.toHaveBeenCalled();
  });

  it('should refuse a direct upload while the source has an active run', async () => {
    const { handler, captures } = setup({ activeRun: true });

    await expect(handler.execute(new UploadCaptureCommand(SOURCE_ID, file([POST]), {}))).rejects.toMatchObject({
      errorCode: 'RADAR_RUN_ALREADY_ACTIVE',
    });
    expect(captures.saveCapture).not.toHaveBeenCalled();
  });

  it('should start image persistence only when items changed, and delete orphaned images', async () => {
    const changed = setup({ saved: { orphanedImageIds: ['radar/old'] } });
    await changed.handler.execute(new UploadCaptureCommand(SOURCE_ID, file([POST]), {}));
    expect(changed.commandBus.execute).toHaveBeenCalledWith(expect.any(PersistItemImagesCommand));
    expect(changed.storage.delete).toHaveBeenCalledWith('radar/old');

    const unchanged = setup({ saved: { created: 0, updated: 0 } });
    await unchanged.handler.execute(new UploadCaptureCommand(SOURCE_ID, file([{ broken: true }]), {}));
    expect(unchanged.commandBus.execute).not.toHaveBeenCalled();
  });

  describe('into a Manual run (runId)', () => {
    const waiting = { flow: RadarRunFlow.MANUAL, captureStatus: RadarStatus.AWAITING_EXTERNAL, itemCap: 1 };

    it('should refuse a run that is not waiting for an upload, or a file over its cap, and write nothing', async () => {
      const cases: [WaitingRun, unknown[], string][] = [
        [{ ...waiting, flow: RadarRunFlow.HYBRID }, [POST], 'RADAR_RUN_NOT_AWAITING_UPLOAD'],
        [{ ...waiting, captureStatus: RadarStatus.DONE }, [POST], 'RADAR_RUN_NOT_AWAITING_UPLOAD'],
        [waiting, [POST, { ...POST, postId: '2' }], 'RADAR_INVALID_UPLOAD'],
      ];
      for (const [run, posts, errorCode] of cases) {
        const { handler, captures } = setup({ run });
        await expect(
          handler.execute(new UploadCaptureCommand(SOURCE_ID, file(posts), { runId: RUN_ID }))
        ).rejects.toMatchObject({ errorCode });
        expect(captures.saveCapturePage).not.toHaveBeenCalled();
      }
    });

    it('should fill the waiting run and hand it to the tick at image copying', async () => {
      const { handler, captures, runs } = setup({ run: waiting });

      const result = await handler.execute(new UploadCaptureCommand(SOURCE_ID, file([POST]), { runId: RUN_ID }));

      expect(result.runId).toBe(RUN_ID);
      expect(captures.saveCapture).not.toHaveBeenCalled();
      expect(captures.saveCapturePage).toHaveBeenCalledWith(expect.objectContaining({ runId: RUN_ID }));
      expect(runs.save.mock.calls[0][0].steps.map((s) => s.status)).toEqual([
        RadarStatus.DONE,
        RadarStatus.DONE,
        RadarStatus.RUNNING,
        RadarStatus.PENDING,
      ]);
    });

    it('should refuse when the run was cancelled or filled by another upload while this file was saved', async () => {
      const { handler } = setup({ run: { ...waiting, completes: false } });

      await expect(
        handler.execute(new UploadCaptureCommand(SOURCE_ID, file([POST]), { runId: RUN_ID }))
      ).rejects.toMatchObject({ errorCode: 'RADAR_RUN_NOT_AWAITING_UPLOAD' });
    });
  });
});
