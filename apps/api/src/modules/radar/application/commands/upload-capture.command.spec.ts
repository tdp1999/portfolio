import { CommandBus } from '@nestjs/cqrs';

import { MulterFile } from '../../../../shared/types';
import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { ApifyFacebookNormalizer } from '../../infrastructure/capture/apify-facebook.normalizer';
import { IRadarCaptureRepository, SaveCaptureResult } from '../ports/radar-capture.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { PersistItemImagesCommand } from './persist-item-images.command';
import { UploadCaptureCommand, UploadCaptureHandler } from './upload-capture.command';

const SOURCE_ID = '01a10755-fd0d-700c-af4f-05a7a675700e';
const POST = { postId: '1', url: 'https://www.facebook.com/x/posts/1', time: '2026-08-14T11:41:03.000Z', text: 'hi' };

const file = (content: unknown): MulterFile => ({
  buffer: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)),
  originalname: 'posts.json',
  mimetype: 'application/json',
});

const setup = (opts: { isActive?: boolean; saved?: Partial<SaveCaptureResult> } = {}) => {
  const sources = {
    findById: jest.fn(async () => ({ id: SOURCE_ID, isActive: opts.isActive ?? true })),
  } as unknown as IRadarSourceRepository;
  const captures = {
    saveCapture: jest.fn(async () => ({ created: 1, updated: 0, orphanedImageIds: [], ...opts.saved })),
  } satisfies IRadarCaptureRepository;
  const commandBus = { execute: jest.fn(async () => undefined) } as unknown as jest.Mocked<CommandBus>;
  const storage = { delete: jest.fn(async () => undefined) } as unknown as jest.Mocked<IStorageService>;
  const handler = new UploadCaptureHandler(commandBus, sources, captures, [new ApifyFacebookNormalizer()], storage);
  return { handler, captures, commandBus, storage };
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

  it('should start image persistence only when items changed, and delete orphaned images', async () => {
    const changed = setup({ saved: { orphanedImageIds: ['radar/old'] } });
    await changed.handler.execute(new UploadCaptureCommand(SOURCE_ID, file([POST]), {}));
    expect(changed.commandBus.execute).toHaveBeenCalledWith(expect.any(PersistItemImagesCommand));
    expect(changed.storage.delete).toHaveBeenCalledWith('radar/old');

    const unchanged = setup({ saved: { created: 0, updated: 0 } });
    await unchanged.handler.execute(new UploadCaptureCommand(SOURCE_ID, file([{ broken: true }]), {}));
    expect(unchanged.commandBus.execute).not.toHaveBeenCalled();
  });
});
