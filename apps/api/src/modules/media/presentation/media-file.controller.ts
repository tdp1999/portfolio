import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { isCloudinaryConfigured } from '../infrastructure/adapters/cloudinary-storage.service';
import { LocalStorageService, MEDIA_FILE_ROUTE } from '../infrastructure/adapters/local-storage.service';

/**
 * Serves the files written by {@link LocalStorageService}.
 *
 * **Unguarded on purpose.** These URLs end up in `<img src>` and `<a href>`, which never carry
 * the bearer token, so the sibling `MediaController` guards (`JwtAccessGuard` + `ADMIN`) cannot
 * apply here. That mirrors Cloudinary, whose delivery URLs are public too — the media library
 * *listing* stays admin-only, individual assets do not.
 *
 * Every request 404s unless the local adapter is actually the active backend — that means both
 * "Cloudinary is configured" and "this is production", the latter checked independently so the
 * route stays dead even if the credentials ever go missing on a deployed instance.
 *
 * It depends on the concrete adapter rather than the `STORAGE_SERVICE` port because path
 * resolution is inherently local-disk-specific and has no meaning in the port.
 */
@Controller(MEDIA_FILE_ROUTE)
export class MediaFileController {
  constructor(private readonly storage: LocalStorageService) {}

  /**
   * `*path` captures the slashes inside an external id (`avatars/photo-<uuid>.png`).
   *
   * No `throw` here, per the module's controller rule: a missing file is an expected outcome for
   * a public asset URL, so it answers 404 directly instead of routing through the error filters.
   */
  @Get('*path')
  getFile(@Param('path') path: string | string[], @Res() res: Response): void {
    if (isCloudinaryConfigured() || process.env['NODE_ENV'] === 'production') {
      res.sendStatus(404);
      return;
    }

    const externalId = Array.isArray(path) ? path.join('/') : path;
    const absolute = this.storage.resolveWithinRoot(externalId);
    if (!absolute) {
      res.sendStatus(404);
      return;
    }

    // helmet defaults `Cross-Origin-Resource-Policy` to `same-origin`, which would stop the
    // console (:4300) from rendering an image served by the API (:3000). Cloudinary URLs never
    // hit this because they are a third origin with no such header.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // These bytes are user-supplied and served from the API's own origin, which Cloudinary's
    // third-party host never was. `LocalStorageService` already names files from the validated
    // MIME type so an `.html` or `.svg` payload cannot arrive here, but the response is locked
    // down anyway: nothing may load, and the document is sandboxed even if the type slips.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");

    res.sendFile(absolute, (error) => {
      if (error && !res.headersSent) res.sendStatus(404);
    });
  }
}
