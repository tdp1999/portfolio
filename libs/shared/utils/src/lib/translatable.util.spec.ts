import { getLocalized, isValidTimezone, TimezoneSchema } from './translatable.util';

describe('getLocalized', () => {
  it('should return the requested locale', () => {
    expect(getLocalized({ en: 'Hello', vi: 'Xin chao' }, 'vi')).toBe('Xin chao');
  });

  it('should fall back to en when requested locale is missing', () => {
    expect(getLocalized({ en: 'Hello' } as { en: string; vi: string }, 'vi')).toBe('Hello');
  });

  it('should fall back to first available when en is also missing', () => {
    expect(getLocalized({ vi: 'Xin chao' } as { en: string; vi: string }, 'en')).toBe('Xin chao');
  });

  it('should return empty string for null', () => {
    expect(getLocalized(null, 'en')).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(getLocalized(undefined, 'en')).toBe('');
  });

  it('should return empty string for empty object', () => {
    expect(getLocalized({} as { en: string; vi: string }, 'en')).toBe('');
  });
});

describe('isValidTimezone', () => {
  it('should accept valid IANA timezone', () => {
    expect(isValidTimezone('America/New_York')).toBe(true);
  });

  it('should accept UTC', () => {
    expect(isValidTimezone('UTC')).toBe(true);
  });

  it('should accept Asia/Ho_Chi_Minh', () => {
    expect(isValidTimezone('Asia/Ho_Chi_Minh')).toBe(true);
  });

  it('should reject invalid timezone string', () => {
    expect(isValidTimezone('Not/A/Timezone')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidTimezone('')).toBe(false);
  });
});

describe('TimezoneSchema', () => {
  it('should accept valid timezone', () => {
    const result = TimezoneSchema.safeParse('Europe/London');
    expect(result.success).toBe(true);
  });

  it('should reject invalid timezone', () => {
    const result = TimezoneSchema.safeParse('Invalid/Zone');
    expect(result.success).toBe(false);
  });
});
