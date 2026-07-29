import { CloudinaryStorageService } from './cloudinary-storage.service';
import { LocalStorageService } from './local-storage.service';
import { createStorageService } from './storage.factory';

jest.mock('cloudinary', () => ({
  v2: { config: jest.fn(), uploader: { upload_stream: jest.fn(), destroy: jest.fn() }, url: jest.fn() },
}));

/**
 * The linchpin of the storage change: which adapter `STORAGE_SERVICE` resolves to. Both adapters
 * are covered on their own, so what these tests pin down is the choice between them.
 */
describe('createStorageService()', () => {
  const CREDENTIALS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'] as const;
  let local: LocalStorageService;
  let nodeEnv: string | undefined;

  function setCredentials(): void {
    for (const key of CREDENTIALS) process.env[key] = 'set';
  }

  beforeEach(() => {
    nodeEnv = process.env['NODE_ENV'];
    for (const key of CREDENTIALS) delete process.env[key];
    local = new LocalStorageService();
  });

  afterEach(() => {
    for (const key of CREDENTIALS) delete process.env[key];
    if (nodeEnv === undefined) delete process.env['NODE_ENV'];
    else process.env['NODE_ENV'] = nodeEnv;
  });

  it('returns the Cloudinary adapter when all three credentials are present', () => {
    setCredentials();

    expect(createStorageService(local)).toBeInstanceOf(CloudinaryStorageService);
  });

  it('returns the injected local adapter when they are absent', () => {
    process.env['NODE_ENV'] = 'development';

    expect(createStorageService(local)).toBe(local);
  });

  it.each(CREDENTIALS)('returns the local adapter when only %s is missing', (missing) => {
    process.env['NODE_ENV'] = 'development';
    setCredentials();
    delete process.env[missing];

    expect(createStorageService(local)).toBe(local);
  });

  // The local adapter writes host-bound URLs into the database and stores files on ephemeral
  // disk. A production instance whose credentials went missing must not quietly start doing that.
  it('refuses to fall back in production', () => {
    process.env['NODE_ENV'] = 'production';

    expect(() => createStorageService(local)).toThrow(/required in production/);
  });

  it('still uses Cloudinary in production when it is configured', () => {
    process.env['NODE_ENV'] = 'production';
    setCredentials();

    expect(createStorageService(local)).toBeInstanceOf(CloudinaryStorageService);
  });
});
