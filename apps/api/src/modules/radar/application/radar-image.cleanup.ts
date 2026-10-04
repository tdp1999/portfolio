import { Logger } from '@nestjs/common';

import { IStorageService } from '../../media/application/ports/storage.service.port';

/** Small enough to stay polite to the storage API, large enough that thousands of files finish. */
const DELETE_CONCURRENCY = 5;

/**
 * Best-effort delete of stored Radar images. Deleting a file that is already gone is a no-op in
 * the storage adapters, so a caller may simply repeat after a failure. Returns the failure count.
 */
export async function deleteStoredImages(storage: IStorageService, ids: string[], logger: Logger): Promise<number> {
  let failed = 0;
  for (let i = 0; i < ids.length; i += DELETE_CONCURRENCY) {
    const outcomes = await Promise.allSettled(ids.slice(i, i + DELETE_CONCURRENCY).map((id) => storage.delete(id)));
    outcomes.forEach((o, j) => {
      if (o.status === 'rejected') {
        failed++;
        logger.warn(
          `Could not delete radar image ${ids[i + j]}: ${o.reason instanceof Error ? o.reason.message : o.reason}`
        );
      }
    });
  }
  return failed;
}
