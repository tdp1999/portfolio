import { RequestOptions, get } from 'node:https';

import { DownloadedMedia, IMediaDownloader } from '../../application/ports/media-downloader.port';

const MAX_REDIRECTS = 3;
/** Node's 250 ms default drops IPv4 before a trans-Pacific handshake completes. */
const FAMILY_ATTEMPT_MS = 1_000;

/**
 * Downloads over `node:https` rather than global `fetch`: Facebook CDN hosts publish AAAA records,
 * and on networks without working IPv6 `fetch` stalls on the IPv6 address until its connect
 * timeout. `autoSelectFamily` races IPv4 and IPv6 (happy eyeballs) so a dead family costs
 * one attempt window instead of the whole request.
 */
export class FetchMediaDownloader implements IMediaDownloader {
  /** Post images: slides and screenshots, rarely over a few MB. */
  static images(): FetchMediaDownloader {
    return new FetchMediaDownloader('image', 15 * 1024 * 1024, 15_000);
  }

  /**
   * Videos for a transcript. The whole file is held in memory and sent inline, so the cap keeps one
   * download well inside the API's RAM (task 387); a reel's SD file is a few MB.
   */
  static videos(): FetchMediaDownloader {
    return new FetchMediaDownloader('video', 20 * 1024 * 1024, 60_000);
  }

  private constructor(
    private readonly kind: 'image' | 'video',
    private readonly maxBytes: number,
    private readonly timeoutMs: number
  ) {}

  download(url: string): Promise<DownloadedMedia> {
    return this.request(url, MAX_REDIRECTS, AbortSignal.timeout(this.timeoutMs));
  }

  private request(url: string, redirectsLeft: number, signal: AbortSignal): Promise<DownloadedMedia> {
    return new Promise((resolve, reject) => {
      // Forwarded to net.connect at runtime; missing from this @types/node RequestOptions.
      const options: RequestOptions & { autoSelectFamily: boolean; autoSelectFamilyAttemptTimeout: number } = {
        signal,
        autoSelectFamily: true,
        autoSelectFamilyAttemptTimeout: FAMILY_ATTEMPT_MS,
      };
      const req = get(url, options, (res) => {
        const status = res.statusCode ?? 0;

        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft === 0) return reject(new Error('Too many redirects'));
          return resolve(this.request(new URL(res.headers.location, url).toString(), redirectsLeft - 1, signal));
        }
        if (status < 200 || status >= 300) {
          res.resume();
          return reject(new Error(`HTTP ${status}`));
        }

        const mimeType = (res.headers['content-type'] ?? '').split(';')[0].trim();
        if (!mimeType.startsWith(`${this.kind}/`)) {
          res.resume();
          return reject(new Error(`Not a ${this.kind} (${mimeType || 'no content-type'})`));
        }
        // Refused before reading when the server says the size up front.
        if (Number(res.headers['content-length']) > this.maxBytes) {
          res.resume();
          return reject(new Error(`File larger than ${this.maxBytes / 1024 / 1024} MB`));
        }

        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > this.maxBytes) {
            req.destroy(new Error(`File larger than ${this.maxBytes / 1024 / 1024} MB`));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), mimeType }));
        res.on('error', reject);
      });

      req.on('error', (err) =>
        reject(err.name === 'AbortError' ? new Error(`Timed out after ${this.timeoutMs} ms`) : err)
      );
    });
  }
}
