import { BadRequestError, ErrorLayer } from '@portfolio/shared/errors';

export class TemporalValue {
  static now(): Date {
    return new Date();
  }

  static fromISO(iso: string): Date {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      throw BadRequestError(`Invalid ISO date: ${iso}`, { layer: ErrorLayer.DOMAIN });
    }
    return date;
  }

  static toISO(date: Date): string {
    return date.toISOString();
  }
}
