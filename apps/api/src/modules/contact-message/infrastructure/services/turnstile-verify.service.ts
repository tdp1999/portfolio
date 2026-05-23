import { Injectable, Logger } from '@nestjs/common';
import { ITurnstileVerifier } from '../../application/ports/turnstile-verifier.port';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface SiteVerifyResponse {
  readonly success: boolean;
  readonly 'error-codes'?: readonly string[];
  readonly hostname?: string;
  readonly action?: string;
  readonly cdata?: string;
}

@Injectable()
export class TurnstileVerifyService implements ITurnstileVerifier {
  private readonly logger = new Logger(TurnstileVerifyService.name);
  private readonly secret: string | undefined;
  private readonly isProduction: boolean;

  constructor() {
    this.secret = process.env['TURNSTILE_SECRET_KEY'];
    this.isProduction = process.env['NODE_ENV'] === 'production';
    if (!this.secret && this.isProduction) {
      throw new Error('TURNSTILE_SECRET_KEY environment variable is required in production');
    }
    if (!this.secret) {
      this.logger.warn('TURNSTILE_SECRET_KEY is not set — verification will be skipped in non-production.');
    }
  }

  async verify(token: string, ip?: string): Promise<boolean> {
    if (!this.secret) {
      this.logger.log('[DEV] Skipping Turnstile verification (no secret configured)');
      return true;
    }

    const body = new URLSearchParams();
    body.set('secret', this.secret);
    body.set('response', token);
    if (ip) body.set('remoteip', ip);

    try {
      const res = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) {
        this.logger.warn(`Turnstile siteverify HTTP ${res.status}`);
        return false;
      }
      const data = (await res.json()) as SiteVerifyResponse;
      if (!data.success) {
        this.logger.warn(`Turnstile rejected: ${(data['error-codes'] ?? []).join(', ') || 'unknown'}`);
      }
      return data.success;
    } catch (err) {
      this.logger.error(`Turnstile siteverify failed: ${err}`);
      return false;
    }
  }
}
