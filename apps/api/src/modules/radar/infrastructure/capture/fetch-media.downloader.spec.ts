import { EventEmitter } from 'node:events';
import { get } from 'node:https';

import { FetchMediaDownloader } from './fetch-media.downloader';

jest.mock('node:https', () => ({ get: jest.fn() }));

const MB = 1024 * 1024;

/** A fake response that streams the given chunks after the callback has attached its listeners. */
function respond(headers: Record<string, string>, chunks: Buffer[] = []) {
  const res = Object.assign(new EventEmitter(), { statusCode: 200, headers, resume: jest.fn() });
  const emitter = new EventEmitter();
  const req = Object.assign(emitter, { destroy: jest.fn((err: Error): boolean => emitter.emit('error', err)) });
  jest.mocked(get).mockImplementation(((_url: string, _opts: unknown, cb: (r: typeof res) => void) => {
    cb(res);
    setImmediate(() => {
      for (const chunk of chunks) {
        if (req.destroy.mock.calls.length > 0) return;
        res.emit('data', chunk);
      }
      res.emit('end');
    });
    return req;
  }) as never);
  return { res, req };
}

describe('FetchMediaDownloader', () => {
  it('should refuse a video whose announced size passes the cap without reading it', async () => {
    const { res } = respond({ 'content-type': 'video/mp4', 'content-length': String(21 * MB) });

    await expect(FetchMediaDownloader.videos().download('https://video.xx.fbcdn.net/r.mp4')).rejects.toThrow(
      'File larger than 20 MB'
    );
    expect(res.resume).toHaveBeenCalled();
  });

  it('should abort the stream once a video with no announced size passes the cap', async () => {
    const { req } = respond({ 'content-type': 'video/mp4' }, [
      Buffer.alloc(15 * MB),
      Buffer.alloc(6 * MB),
      Buffer.alloc(MB),
    ]);

    await expect(FetchMediaDownloader.videos().download('https://video.xx.fbcdn.net/r.mp4')).rejects.toThrow(
      'File larger than 20 MB'
    );
    expect(req.destroy).toHaveBeenCalledTimes(1);
  });
});
