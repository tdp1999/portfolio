import { Logger } from '@nestjs/common';
import { IStorageService } from '../../application/ports/storage.service.port';
import { CloudinaryStorageService, isCloudinaryConfigured } from './cloudinary-storage.service';
import { LocalStorageService } from './local-storage.service';

/**
 * Picks the storage backend for `STORAGE_SERVICE`.
 *
 * Called from a `useFactory` rather than being a conditional `useClass` so the environment is read
 * when the module is instantiated — after `main.ts` runs `dotenv.config()` — not when the module
 * decorator is evaluated at import time. Nest calls `onModuleInit` on factory-produced providers,
 * so the Cloudinary adapter still configures itself exactly as before.
 *
 * **Production never falls back.** The local adapter is a development and CI facility: it writes
 * absolute `http://localhost:3000/...` URLs into the database and stores files on ephemeral disk.
 * A production deploy whose `CLOUDINARY_*` secret went missing or got rotated must fail loudly at
 * boot rather than quietly start corrupting rows — the same posture as `CORS_ORIGINS` in
 * `main.ts`. Without this check the "disabled in production" claim would really only mean
 * "Cloudinary happens to be configured".
 */
export function createStorageService(local: LocalStorageService): IStorageService {
  if (isCloudinaryConfigured()) {
    // Hand-constructed, so this instance is outside DI. Fine while the adapter takes no
    // constructor arguments; give it a dependency and it must become a provider instead.
    return new CloudinaryStorageService();
  }

  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required in production');
  }

  new Logger('MediaStorage').warn(
    `Cloudinary not configured; using local file storage at ${local.describe()}. ` +
      'Thumbnail transforms are unavailable and stored URLs are bound to this host.'
  );
  return local;
}
