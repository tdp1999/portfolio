import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { ImageResult } from '../../domain/radar-media.util';
import { RadarMedia } from '../../domain/radar.types';
import { IMediaDownloader } from '../ports/media-downloader.port';
import { IRadarImageRepository, RadarItemImages } from '../ports/radar-image.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { DeleteSourceCommand, DeleteSourceHandler } from './delete-source.command';
import { PersistItemImagesCommand, PersistItemImagesHandler } from './persist-item-images.command';

const SOURCE_ID = '01a10755-fd0d-700c-af4f-05a7a675700e';

const pending = (externalId: string): RadarMedia => ({
  type: 'photo',
  url: `https://cdn.fb/${externalId}.jpg`,
  thumbnailUrl: null,
  width: null,
  height: null,
  ocrText: null,
  externalId,
  storedUrl: null,
  storedExternalId: null,
  storageStatus: 'pending',
  storageError: null,
});

const item = (id: string, ...ids: string[]): RadarItemImages => ({ id, media: ids.map(pending), sharedPost: null });

const setup = (batches: RadarItemImages[][], orphaned: string[] = []) => {
  const repo = {
    findWithPendingImages: jest.fn(async (_limit: number) => batches.shift() ?? []),
    applyResults: jest.fn(async (_id: string, _results: ImageResult[]) => ({ orphaned })),
    findStoredExternalIds: jest.fn(),
  } satisfies IRadarImageRepository;
  const storage = {
    upload: jest.fn(async (_b: Buffer, o: { originalFilename: string }) => ({
      externalId: `radar/${o.originalFilename}`,
      url: `https://res/${o.originalFilename}`,
      format: 'jpg',
      bytes: 1,
    })),
    delete: jest.fn(async () => undefined),
  } as unknown as jest.Mocked<IStorageService>;
  const downloader: IMediaDownloader = {
    download: jest.fn(async (url: string) => {
      if (url.includes('broken')) throw new Error('Timed out after 15000 ms');
      return { buffer: Buffer.from('x'), mimeType: url.includes('svg') ? 'image/svg+xml' : 'image/jpeg' };
    }),
  };
  return { repo, storage, handler: new PersistItemImagesHandler(repo, storage, downloader) };
};

describe('PersistItemImagesHandler', () => {
  it('should report a failed download or a non-raster type as failed and still store the next image', async () => {
    const { repo, handler } = setup([[item('i1', 'broken', 'logo-svg', 'ok')]]);

    const result = await handler.execute();

    const [, results] = repo.applyResults.mock.calls[0];
    expect(results.map((r) => r.outcome)).toEqual(['failed', 'failed', 'stored']);
    expect(result).toEqual({ stored: 1, failed: 2, alreadyRunning: false });
  });

  it('should stop after maxItems items even when more images are pending', async () => {
    const { repo, handler } = setup([]);
    let n = 0;
    // An endless pending pool: without the limit the drain would never end.
    repo.findWithPendingImages.mockImplementation(async (limit: number) =>
      Array.from({ length: limit }, () => item(`i${n++}`, 'ok'))
    );

    await handler.execute(new PersistItemImagesCommand(3));

    expect(repo.applyResults).toHaveBeenCalledTimes(3);
  });

  it('should delete the uploads the repository reports as orphaned', async () => {
    const { storage, handler } = setup([[item('gone', 'a')]], ['radar/a.jpg']);

    await handler.execute();

    expect(storage.delete).toHaveBeenCalledWith('radar/a.jpg');
  });

  it('should drain once more when called while a run is in progress', async () => {
    const { repo, handler } = setup([[item('i1', 'a')]]);
    let second: Promise<unknown> | undefined;
    repo.applyResults.mockImplementationOnce(async () => {
      second = handler.execute(); // arrives mid-run
      return { orphaned: [] };
    });

    await handler.execute();

    await expect(second).resolves.toMatchObject({ alreadyRunning: true });
    // first drain: batch + empty check; rerun drain: one more empty check
    expect(repo.findWithPendingImages).toHaveBeenCalledTimes(3);
  });

  it('should not let a bounded call drain the backlog of a call that arrived mid-run', async () => {
    let n = 0;
    const { repo, handler } = setup([]);
    // Five items in the pool, served up to the limit asked for.
    repo.findWithPendingImages.mockImplementation(async (limit: number) =>
      Array.from({ length: Math.min(limit, 5 - n) }, () => item(`i${n++}`, `p${n}`))
    );
    repo.applyResults.mockImplementationOnce(async () => {
      void handler.execute(); // an upload asks for everything while the tick is copying
      return { orphaned: [] };
    });

    const tick = await handler.execute(new PersistItemImagesCommand(1));

    expect(tick.stored).toBe(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(repo.applyResults).toHaveBeenCalledTimes(5);
  });
});

describe('DeleteSourceHandler', () => {
  it('should keep the source when an image delete fails, and remove it once all images are gone', async () => {
    const sources = {
      findById: jest.fn(async () => ({ id: SOURCE_ID })),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IRadarSourceRepository>;
    const images = {
      findStoredExternalIds: jest.fn(async () => ['radar/a', 'radar/b']),
    } as unknown as IRadarImageRepository;
    const storage = {
      delete: jest.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IStorageService>;
    const handler = new DeleteSourceHandler(sources, images, storage);

    await expect(handler.execute(new DeleteSourceCommand(SOURCE_ID))).rejects.toMatchObject({ statusCode: 502 });
    expect(sources.delete).not.toHaveBeenCalled();

    await expect(handler.execute(new DeleteSourceCommand(SOURCE_ID))).resolves.toEqual({ imagesDeleted: 2 });
    expect(sources.delete).toHaveBeenCalledWith(SOURCE_ID);
  });
});
