import { z } from 'zod/v4';
import { nonEmptyPartial, stripHtmlTags, ERR_EMPTY_PAYLOAD } from './schema.util';

const TestSchema = z.object({
  name: z.string(),
  age: z.number(),
});

describe('nonEmptyPartial', () => {
  const PartialSchema = nonEmptyPartial(TestSchema);

  it('should accept a partial object with one field', () => {
    expect(PartialSchema.safeParse({ name: 'John' }).success).toBe(true);
  });

  it('should accept a partial object with all fields', () => {
    expect(PartialSchema.safeParse({ name: 'John', age: 30 }).success).toBe(true);
  });

  it('should reject an empty object', () => {
    const result = PartialSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(ERR_EMPTY_PAYLOAD);
    }
  });

  it('should still validate field types', () => {
    expect(PartialSchema.safeParse({ name: 123 }).success).toBe(false);
  });
});

describe('stripHtmlTags', () => {
  it('should drop a tag pair and keep its text content', () => {
    expect(stripHtmlTags('<p>hello</p>')).toBe('hello');
  });

  it('should drop tags carrying attributes', () => {
    expect(stripHtmlTags('<a href="https://x.test" target="_blank">link</a>')).toBe('link');
  });

  it('should drop a self-closing tag entirely', () => {
    expect(stripHtmlTags('before<br />after')).toBe('beforeafter');
  });

  it('should drop an event-handler tag with no text content', () => {
    expect(stripHtmlTags('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('should leave plain text untouched', () => {
    expect(stripHtmlTags('no markup here')).toBe('no markup here');
  });

  it('should return an empty string for an empty input', () => {
    expect(stripHtmlTags('')).toBe('');
  });

  // The strip is structural only (see the function's doc comment): output encoding
  // in the frontend is the real XSS defense. These cases pin that boundary so nobody
  // mistakes this helper for a sanitizer.
  it('should keep a bare "<" that opens no tag', () => {
    expect(stripHtmlTags('2 < 3')).toBe('2 < 3');
  });

  it('should not decode HTML entities', () => {
    expect(stripHtmlTags('&lt;script&gt;')).toBe('&lt;script&gt;');
  });

  it('should leave the trailing ">" of a malformed nested tag', () => {
    expect(stripHtmlTags('<<p>>')).toBe('>');
  });
});
