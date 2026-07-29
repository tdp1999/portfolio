import { config } from 'dotenv';
import { resolve } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from './db';
import { TEST_MEDIA_PREFIX } from '../data/test-media';

config({ path: resolve(process.cwd(), '.env') });

let cloudinaryConfigured = false;

/**
 * Mirrors the API's own adapter choice: no credentials means uploads went to local disk, so
 * there is nothing in Cloudinary to destroy. Calling `destroy` anyway just rejects with
 * `Must supply api_key` once per test asset and buries the real output in warnings.
 */
function hasCloudinaryCredentials(): boolean {
  return Boolean(
    process.env['CLOUDINARY_CLOUD_NAME'] && process.env['CLOUDINARY_API_KEY'] && process.env['CLOUDINARY_API_SECRET']
  );
}

function ensureCloudinary(): void {
  if (cloudinaryConfigured) return;
  cloudinary.config({
    cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
    api_key: process.env['CLOUDINARY_API_KEY'],
    api_secret: process.env['CLOUDINARY_API_SECRET'],
    secure: true,
  });
  cloudinaryConfigured = true;
}

export async function deleteTestMedia(): Promise<void> {
  // 1. Find all test media records (including soft-deleted)
  const records = await prisma.media.findMany({
    where: { originalFilename: { startsWith: TEST_MEDIA_PREFIX } },
    select: { publicId: true },
  });

  // 2. Delete from Cloudinary. Local-disk assets need no remote cleanup — the storage dir is
  //    disposable and gitignored.
  if (records.length > 0 && hasCloudinaryCredentials()) {
    ensureCloudinary();
    const destroyResults = await Promise.allSettled(records.map((r) => cloudinary.uploader.destroy(r.publicId)));
    const failed = destroyResults.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`[db-media] ${failed.length}/${records.length} Cloudinary deletes failed`);
    }
  }

  // 3. Delete from DB
  await prisma.media.deleteMany({
    where: { originalFilename: { startsWith: TEST_MEDIA_PREFIX } },
  });
}
