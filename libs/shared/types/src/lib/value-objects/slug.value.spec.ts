import { SlugValue } from './slug.value';

describe('SlugValue', () => {
  it('should convert text to lowercase slug', () => {
    expect(SlugValue.from('Hello World')).toBe('hello-world');
  });

  it('should handle special characters', () => {
    expect(SlugValue.from('Hello & World!')).toBe('hello-world');
  });

  it('should handle unicode/accented characters', () => {
    expect(SlugValue.from('Café Résumé')).toBe('cafe-resume');
  });

  it('should handle Vietnamese characters', () => {
    expect(SlugValue.from('Xin Chào Việt Nam')).toBe('xin-chao-viet-nam');
  });

  it('should collapse multiple separators', () => {
    expect(SlugValue.from('hello---world')).toBe('hello-world');
  });

  it('should trim leading/trailing dashes', () => {
    expect(SlugValue.from('--hello--')).toBe('hello');
  });

  it('should throw on empty text', () => {
    expect(() => SlugValue.from('')).toThrow('Cannot create slug from empty text');
    expect(() => SlugValue.from('   ')).toThrow('Cannot create slug from empty text');
  });
});
