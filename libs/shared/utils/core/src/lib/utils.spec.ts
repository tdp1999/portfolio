import { formatDate } from './utils';

describe('formatDate', () => {
  it('should format date to YYYY-MM-DD', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDate(date);

    expect(result).toBe('2024-01-15');
  });

  it('should handle different dates correctly', () => {
    const date = new Date('2025-12-31T23:59:59Z');
    const result = formatDate(date);

    expect(result).toBe('2025-12-31');
  });
});
