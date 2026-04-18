import { v2 as cloudinary } from 'cloudinary';
import { DomainError } from '@portfolio/shared/errors';
import { CloudinaryStorageService } from './cloudinary-storage.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
    url: jest.fn(),
  },
}));

describe('CloudinaryStorageService', () => {
  let service: CloudinaryStorageService;

  const mockUploadResult = {
    public_id: 'portfolio/projects/abc123',
    secure_url: 'https://res.cloudinary.com/demo/image/upload/portfolio/projects/abc123.png',
    format: 'png',
    bytes: 204800,
    width: 1920,
    height: 1080,
  };

  beforeEach(() => {
    process.env['CLOUDINARY_CLOUD_NAME'] = 'demo';
    process.env['CLOUDINARY_API_KEY'] = 'key123';
    process.env['CLOUDINARY_API_SECRET'] = 'secret123';

    service = new CloudinaryStorageService();
    service.onModuleInit();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env['CLOUDINARY_CLOUD_NAME'];
    delete process.env['CLOUDINARY_API_KEY'];
    delete process.env['CLOUDINARY_API_SECRET'];
  });

  describe('onModuleInit()', () => {
    it('should warn and skip configuration when env vars are missing', () => {
      delete process.env['CLOUDINARY_CLOUD_NAME'];
      delete process.env['CLOUDINARY_API_KEY'];
      delete process.env['CLOUDINARY_API_SECRET'];

      const svc = new CloudinaryStorageService();
      const warnSpy = jest.spyOn(svc['logger'], 'warn').mockImplementation();

      expect(() => svc.onModuleInit()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Cloudinary env vars missing'));
      expect(cloudinary.config).not.toHaveBeenCalled();
    });

    it('should configure cloudinary with env vars', () => {
      service.onModuleInit();

      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'demo',
        api_key: 'key123',
        api_secret: 'secret123',
        secure: true,
      });
    });
  });

  describe('upload()', () => {
    it('should upload a buffer and return StorageResult', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, callback) => ({
        end: () => callback(null, mockUploadResult),
      }));

      const result = await service.upload(Buffer.from('file'), {
        folder: 'projects',
        originalFilename: 'test.png',
        mimeType: 'image/png',
      });

      expect(result.externalId).toBe('portfolio/projects/abc123');
      expect(result.url).toContain('cloudinary.com');
      expect(result.format).toBe('png');
      expect(result.bytes).toBe(204800);
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should pass asset_folder with portfolio prefix', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts, callback) => ({
        end: () => {
          expect(opts.asset_folder).toBe('portfolio/avatars');
          expect(opts.use_filename).toBe(true);
          expect(opts.unique_filename).toBe(true);
          expect(opts.filename_override).toBe('me.png');
          expect(opts.display_name).toBe('me.png');
          expect(opts.overwrite).toBe(false);
          expect(opts.invalidate).toBe(true);
          expect(opts.context).toEqual(
            expect.objectContaining({
              original_filename: 'me.png',
              mime_type: 'image/png',
              folder: 'avatars',
            })
          );
          callback(null, mockUploadResult);
        },
      }));

      await service.upload(Buffer.from('file'), {
        folder: 'avatars',
        originalFilename: 'me.png',
        mimeType: 'image/png',
      });
    });

    it('should use CLOUDINARY_FOLDER_PREFIX when set', async () => {
      process.env['CLOUDINARY_FOLDER_PREFIX'] = 'dev';
      const prefixedService = new CloudinaryStorageService();
      prefixedService.onModuleInit();

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((opts, callback) => ({
        end: () => {
          expect(opts.asset_folder).toBe('dev/portfolio/avatars');
          callback(null, mockUploadResult);
        },
      }));

      await prefixedService.upload(Buffer.from('file'), {
        folder: 'avatars',
        originalFilename: 'me.png',
        mimeType: 'image/png',
      });
      delete process.env['CLOUDINARY_FOLDER_PREFIX'];
    });

    it('should throw MEDIA_UPLOAD_FAILED on error', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, callback) => ({
        end: () => callback(new Error('Network error'), null),
      }));

      try {
        await service.upload(Buffer.from('file'), {
          folder: 'projects',
          originalFilename: 'test.png',
          mimeType: 'image/png',
        });
        fail('Expected error');
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).errorCode).toBe('MEDIA_UPLOAD_FAILED');
      }
    });

    it('should omit width/height for non-image uploads', async () => {
      const docResult = { ...mockUploadResult, width: undefined, height: undefined };
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, callback) => ({
        end: () => callback(null, docResult),
      }));

      const result = await service.upload(Buffer.from('file'), {
        folder: 'docs',
        resourceType: 'raw',
        originalFilename: 'note.txt',
        mimeType: 'text/plain',
      });

      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });

    it('should derive format from filename extension when raw upload omits format', async () => {
      const rawResult = { ...mockUploadResult, format: undefined, width: undefined, height: undefined };
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, callback) => ({
        end: () => callback(null, rawResult),
      }));

      const result = await service.upload(Buffer.from('file'), {
        folder: 'docs',
        resourceType: 'raw',
        originalFilename: 'report.zip',
        mimeType: 'application/zip',
      });

      expect(result.format).toBe('zip');
    });
  });

  describe('uploadBulk()', () => {
    it('should upload multiple files and return results', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, callback) => ({
        end: () => callback(null, mockUploadResult),
      }));

      const files = [
        { buffer: Buffer.from('a'), originalFilename: 'a.png', mimeType: 'image/png' },
        { buffer: Buffer.from('b'), originalFilename: 'b.png', mimeType: 'image/png' },
      ];

      const result = await service.uploadBulk(files, { folder: 'projects' });

      expect(result.succeeded).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.succeeded[0].originalFilename).toBe('a.png');
    });

    it('should handle partial failures', async () => {
      let callCount = 0;
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_opts, callback) => ({
        end: () => {
          callCount++;
          if (callCount === 2) {
            callback(new Error('Upload failed'), null);
          } else {
            callback(null, mockUploadResult);
          }
        },
      }));

      const files = [
        { buffer: Buffer.from('a'), originalFilename: 'a.png', mimeType: 'image/png' },
        { buffer: Buffer.from('b'), originalFilename: 'b.png', mimeType: 'image/png' },
      ];

      const result = await service.uploadBulk(files, { folder: 'projects' });

      expect(result.succeeded).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].filename).toBe('b.png');
    });

    it('should reject more than 10 files', async () => {
      const files = Array.from({ length: 11 }, (_, i) => ({
        buffer: Buffer.from('x'),
        originalFilename: `file${i}.png`,
        mimeType: 'image/png',
      }));

      try {
        await service.uploadBulk(files, { folder: 'projects' });
        fail('Expected error');
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
        expect((e as DomainError).errorCode).toBe('MEDIA_INVALID_INPUT');
      }
    });
  });

  describe('delete()', () => {
    it('should call cloudinary destroy', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await service.delete('portfolio/projects/abc123');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('portfolio/projects/abc123');
    });

    it('should throw on delete failure', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('Not found'));

      try {
        await service.delete('bad-id');
        fail('Expected error');
      } catch (e) {
        expect(e).toBeInstanceOf(DomainError);
      }
    });
  });

  describe('generateUrl()', () => {
    it('should call cloudinary url with secure option', () => {
      (cloudinary.url as jest.Mock).mockReturnValue('https://res.cloudinary.com/demo/image/upload/abc.png');

      const url = service.generateUrl('abc');

      expect(cloudinary.url).toHaveBeenCalledWith('abc', { secure: true });
      expect(url).toContain('cloudinary.com');
    });

    it('should pass transform options', () => {
      (cloudinary.url as jest.Mock).mockReturnValue('https://res.cloudinary.com/demo/image/upload/w_200/abc.png');

      service.generateUrl('abc', { width: '200', crop: 'fill' });

      expect(cloudinary.url).toHaveBeenCalledWith('abc', {
        secure: true,
        transformation: [{ width: '200', crop: 'fill' }],
      });
    });
  });
});
