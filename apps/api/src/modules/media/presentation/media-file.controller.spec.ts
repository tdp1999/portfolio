import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { LocalStorageService } from '../infrastructure/adapters/local-storage.service';
import { MediaFileController } from './media-file.controller';

/**
 * Driven through a real Nest app rather than by calling the handler, because the parts most
 * likely to break are the router's and Express's: the `*path` wildcard (Express 5 / path-to-regexp
 * 8 needs it *named*, unlike the bare `*` of Express 4) and `res.sendFile`.
 */
describe('MediaFileController', () => {
  let app: INestApplication;
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'media-file-controller-spec-'));
    process.env['LOCAL_STORAGE_DIR'] = root;
    delete process.env['CLOUDINARY_CLOUD_NAME'];
    delete process.env['CLOUDINARY_API_KEY'];
    delete process.env['CLOUDINARY_API_SECRET'];

    const moduleRef = await Test.createTestingModule({
      controllers: [MediaFileController],
      providers: [LocalStorageService],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same prefix as `main.ts`, so the paths asserted below are the real ones.
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env['LOCAL_STORAGE_DIR'];
    await rm(root, { recursive: true, force: true });
  });

  async function store(relativePath: string, contents: Buffer | string): Promise<void> {
    const absolute = join(root, relativePath);
    await mkdir(join(absolute, '..'), { recursive: true });
    await writeFile(absolute, contents);
  }

  it('serves a stored file through the multi-segment wildcard', async () => {
    await store('avatars/photo-1.png', Buffer.from('png-bytes'));

    const res = await request(app.getHttpServer()).get('/api/media-files/avatars/photo-1.png').expect(200);

    expect(res.body).toEqual(Buffer.from('png-bytes'));
    expect(res.headers['content-type']).toContain('image/png');
  });

  it('marks the response cross-origin so the console can embed it', async () => {
    // helmet defaults this to `same-origin`, which would block a :3000 image inside a :4300 page.
    await store('avatars/photo-2.png', Buffer.from('png-bytes'));

    const res = await request(app.getHttpServer()).get('/api/media-files/avatars/photo-2.png').expect(200);

    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('locks the response down so served bytes cannot act as a document', async () => {
    // These are user-supplied bytes on the API's own origin, which Cloudinary's third-party host
    // never was. The adapter already names files from the validated MIME type; this is the belt.
    await store('general/note.txt', Buffer.from('<script>alert(1)</script>'));

    const res = await request(app.getHttpServer()).get('/api/media-files/general/note.txt').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBe("default-src 'none'; sandbox");
  });

  it('serves a PDF with its own content type', async () => {
    await store('resumes/cv.pdf', Buffer.from('%PDF-1.4'));

    const res = await request(app.getHttpServer()).get('/api/media-files/resumes/cv.pdf').expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('404s for a file that is not there', async () => {
    await request(app.getHttpServer()).get('/api/media-files/avatars/missing.png').expect(404);
  });

  it('404s instead of escaping the storage root', async () => {
    const outsider = join(root, '..', 'media-file-controller-outsider.txt');
    await writeFile(outsider, 'do not serve');

    // Encoded so the request reaches Nest with the traversal intact instead of being
    // normalised away by the client.
    await request(app.getHttpServer()).get('/api/media-files/..%2fmedia-file-controller-outsider.txt').expect(404);

    await rm(outsider, { force: true });
  });

  it('404s for everything once Cloudinary is the active backend', async () => {
    await store('avatars/photo-3.png', Buffer.from('png-bytes'));
    process.env['CLOUDINARY_CLOUD_NAME'] = 'demo';
    process.env['CLOUDINARY_API_KEY'] = 'key';
    process.env['CLOUDINARY_API_SECRET'] = 'secret';

    await request(app.getHttpServer()).get('/api/media-files/avatars/photo-3.png').expect(404);

    delete process.env['CLOUDINARY_CLOUD_NAME'];
    delete process.env['CLOUDINARY_API_KEY'];
    delete process.env['CLOUDINARY_API_SECRET'];
  });

  it('404s in production even with no Cloudinary credentials', async () => {
    // `createStorageService` already refuses to select the local adapter in production, so this
    // is the independent second lock: the route stays dead even if that check is ever loosened.
    await store('avatars/photo-4.png', Buffer.from('png-bytes'));
    const nodeEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';

    await request(app.getHttpServer()).get('/api/media-files/avatars/photo-4.png').expect(404);

    if (nodeEnv === undefined) delete process.env['NODE_ENV'];
    else process.env['NODE_ENV'] = nodeEnv;
  });
});
