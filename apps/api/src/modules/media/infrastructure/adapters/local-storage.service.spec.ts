import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DomainError } from '@portfolio/shared/errors';
import { LocalStorageService } from './local-storage.service';

/** 1×1 PNG — the smallest input sharp will report real dimensions for. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

describe('LocalStorageService', () => {
  let root: string;
  let service: LocalStorageService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'local-storage-spec-'));
    process.env['LOCAL_STORAGE_DIR'] = root;
    process.env['LOCAL_STORAGE_PUBLIC_URL'] = 'http://localhost:3000';
    service = new LocalStorageService();
  });

  afterEach(async () => {
    delete process.env['LOCAL_STORAGE_DIR'];
    delete process.env['LOCAL_STORAGE_PUBLIC_URL'];
    await rm(root, { recursive: true, force: true });
  });

  describe('upload()', () => {
    it('writes the bytes under the storage root and addresses them by external id', async () => {
      const result = await service.upload(PNG_1X1, {
        folder: 'avatars',
        originalFilename: 'My Photo.png',
        mimeType: 'image/png',
      });

      await expect(readFile(join(root, result.externalId))).resolves.toEqual(PNG_1X1);
    });

    it('keeps the folder and extension in the external id and slugifies the stem', async () => {
      const result = await service.upload(PNG_1X1, {
        folder: 'avatars',
        originalFilename: 'My Photo (final).png',
        mimeType: 'image/png',
      });

      expect(result.externalId).toMatch(/^avatars\/my-photo-final-[0-9a-f-]{36}\.png$/);
    });

    it('returns a URL built from the public base and the file route', async () => {
      const result = await service.upload(PNG_1X1, {
        folder: 'logos',
        originalFilename: 'logo.png',
        mimeType: 'image/png',
      });

      expect(result.url).toBe(`http://localhost:3000/api/media-files/${result.externalId}`);
    });

    it('never emits the `/upload/` segment the thumbnail pipes key on', async () => {
      // `CloudinaryThumbPipe` splices a transform in after `/upload/` and `CloudinaryPdfThumbPipe`
      // rasterizes on the same marker. A local URL containing it would be rewritten into a
      // 404. This is why the route is `media-files` and not `uploads`.
      const result = await service.upload(PNG_1X1, {
        folder: 'general',
        originalFilename: 'upload.png',
        mimeType: 'image/png',
      });

      expect(result.url).not.toContain('/upload/');
    });

    it('reports the byte length and the raster dimensions', async () => {
      const result = await service.upload(PNG_1X1, {
        folder: 'projects',
        originalFilename: 'shot.png',
        mimeType: 'image/png',
      });

      expect(result).toMatchObject({ format: 'png', bytes: PNG_1X1.length, width: 1, height: 1 });
    });

    it('omits dimensions for non-image files', async () => {
      const result = await service.upload(Buffer.from('%PDF-1.4 not really'), {
        folder: 'resumes',
        originalFilename: 'cv.pdf',
        mimeType: 'application/pdf',
      });

      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });

    it('takes the extension from the mime type, not from the filename', async () => {
      // `text/plain` is waved through without a magic-byte check, so a `.html` name survives the
      // scanner. Naming the stored file from it would let `sendFile` serve user bytes as
      // `text/html` from the API's own origin.
      const result = await service.upload(Buffer.from('<script>alert(1)</script>'), {
        folder: 'general',
        originalFilename: 'poc.html',
        mimeType: 'text/plain',
      });

      expect(result.format).toBe('txt');
      expect(result.externalId).toMatch(/\.txt$/);
      expect(result.externalId).not.toContain('.html');
    });

    it('normalises alternate extensions for the same mime type', async () => {
      const result = await service.upload(PNG_1X1, {
        folder: 'general',
        originalFilename: 'photo.JPEG',
        mimeType: 'image/jpeg',
      });

      expect(result.format).toBe('jpg');
    });

    it('falls back to `bin` for a mime type with no mapped extension', async () => {
      const result = await service.upload(Buffer.from('x'), {
        folder: 'general',
        originalFilename: 'thing.exe',
        mimeType: 'application/x-msdownload',
      });

      expect(result.format).toBe('bin');
      expect(result.externalId).toMatch(/\.bin$/);
    });
  });

  describe('uploadBulk()', () => {
    it('stores every file and reports them as succeeded', async () => {
      const result = await service.uploadBulk(
        [
          { buffer: PNG_1X1, originalFilename: 'one.png', mimeType: 'image/png' },
          { buffer: PNG_1X1, originalFilename: 'two.png', mimeType: 'image/png' },
        ],
        { folder: 'projects' }
      );

      expect(result.failed).toEqual([]);
      expect(result.succeeded.map((s) => s.originalFilename)).toEqual(['one.png', 'two.png']);
      for (const stored of result.succeeded) {
        expect(existsSync(join(root, stored.externalId))).toBe(true);
      }
    });

    it('reports the entries it could not write without losing the ones it could', async () => {
      // A plain file where the `logos` directory needs to be, so `mkdir` fails for that entry
      // only. Everything else in the batch must still land.
      await writeFile(join(root, 'logos'), 'not a directory');

      const result = await service.uploadBulk(
        [
          { buffer: PNG_1X1, originalFilename: 'ok.png', mimeType: 'image/png' },
          { buffer: PNG_1X1, originalFilename: 'blocked.png', mimeType: 'image/png' },
        ],
        { folder: 'logos' }
      );

      expect(result.succeeded).toEqual([]);
      expect(result.failed.map((f) => f.filename)).toEqual(['ok.png', 'blocked.png']);
      expect(result.failed[0].error).toBeTruthy();
    });

    it('rejects a batch over the per-request limit', async () => {
      const files = Array.from({ length: 11 }, (_, i) => ({
        buffer: PNG_1X1,
        originalFilename: `f${i}.png`,
        mimeType: 'image/png',
      }));

      expect.assertions(2);
      try {
        await service.uploadBulk(files, { folder: 'projects' });
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).errorCode).toBe('MEDIA_INVALID_INPUT');
      }
    });
  });

  describe('delete()', () => {
    it('removes the stored file', async () => {
      const { externalId } = await service.upload(PNG_1X1, {
        folder: 'avatars',
        originalFilename: 'gone.png',
        mimeType: 'image/png',
      });

      await service.delete(externalId);

      expect(existsSync(join(root, externalId))).toBe(false);
    });

    it('is a no-op for an id that was already deleted', async () => {
      await expect(service.delete('avatars/never-existed.png')).resolves.toBeUndefined();
    });

    it('refuses an id that escapes the storage root', async () => {
      const outsider = join(root, '..', 'outsider.txt');
      await writeFile(outsider, 'do not touch');

      await service.delete('../outsider.txt');

      expect(existsSync(outsider)).toBe(true);
      await rm(outsider, { force: true });
    });
  });

  describe('resolveWithinRoot()', () => {
    it('resolves an id inside the root', () => {
      expect(service.resolveWithinRoot('avatars/a.png')).toBe(join(root, 'avatars/a.png'));
    });

    // `''` and `'.'` resolve to the root itself; returning it would aim `delete()` at the whole
    // storage directory the moment anyone adds `recursive: true` to that `rm`.
    it.each(['../escape.png', 'avatars/../../escape.png', '/etc/passwd', '', '.', './'])('rejects %p', (id) => {
      expect(service.resolveWithinRoot(id)).toBeNull();
    });
  });

  describe('generateUrl()', () => {
    it('ignores transforms, since there is no local transformation engine', () => {
      expect(service.generateUrl('avatars/a.png')).toBe('http://localhost:3000/api/media-files/avatars/a.png');
    });
  });

  describe('configuration', () => {
    it('trims a trailing slash off the public base URL', async () => {
      process.env['LOCAL_STORAGE_PUBLIC_URL'] = 'https://api.example.com/';
      const configured = new LocalStorageService();

      expect(configured.generateUrl('avatars/a.png')).toBe('https://api.example.com/api/media-files/avatars/a.png');
    });

    it('defaults the public base URL to the configured port', () => {
      delete process.env['LOCAL_STORAGE_PUBLIC_URL'];
      process.env['PORT'] = '4000';
      const configured = new LocalStorageService();

      expect(configured.generateUrl('a.png')).toBe('http://localhost:4000/api/media-files/a.png');
      delete process.env['PORT'];
    });
  });
});
