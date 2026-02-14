export class TemporalValue {
  static now(): Date {
    return new Date();
  }

  static fromISO(iso: string): Date {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ISO date: ${iso}`);
    }
    return date;
  }

  static toISO(date: Date): string {
    return date.toISOString();
  }
}
