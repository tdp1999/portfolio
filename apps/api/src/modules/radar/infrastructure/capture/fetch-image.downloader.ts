import { RequestOptions, get } from 'node:https';

import { DownloadedImage, IImageDownloader } from '../../application/ports/image-downloader.port';

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 3;
/** Node's 250 ms default drops IPv4 before a trans-Pacific handshake completes. */
const FAMILY_ATTEMPT_MS = 1_000;

/**
 * Downloads over `node:https` rather than global `fetch`: Facebook CDN hosts publish AAAA records,
 * and on networks without working IPv6 `fetch` stalls on the IPv6 address until its connect
 * timeout. `autoSelectFamily` races IPv4 and IPv6 (happy eyeballs) so a dead family costs
 * one attempt window instead of the whole request.
 */
export class FetchImageDownloader implements IImageDownloader {
  download(url: string): Promise<DownloadedImage> {
    return this.request(url, MAX_REDIRECTS, AbortSignal.timeout(TIMEOUT_MS));
  }

  private request(url: string, redirectsLeft: number, signal: AbortSignal): Promise<DownloadedImage> {
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
        if (!mimeType.startsWith('image/')) {
          res.resume();
          return reject(new Error(`Not an image (${mimeType || 'no content-type'})`));
        }

        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            req.destroy(new Error(`Image larger than ${MAX_BYTES} bytes`));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), mimeType }));
        res.on('error', reject);
      });

      req.on('error', (err) => reject(err.name === 'AbortError' ? new Error(`Timed out after ${TIMEOUT_MS} ms`) : err));
    });
  }
}
