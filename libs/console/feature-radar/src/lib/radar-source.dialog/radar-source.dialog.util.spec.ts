import { toUploadErrorLines } from './radar-source.dialog.util';

describe('toUploadErrorLines', () => {
  it('should prefix each message with its field path', () => {
    expect(toUploadErrorLines({ '3.url': ['Invalid URL'], '': ['Too many posts'] })).toEqual([
      '3.url: Invalid URL',
      'Too many posts',
    ]);
  });

  it('should return no lines for data that is not a field map', () => {
    expect(toUploadErrorLines(undefined)).toEqual([]);
    expect(toUploadErrorLines(['x'])).toEqual([]);
  });

  it('should cap the list and count the rest', () => {
    const data = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`${i}.text`, ['Required']]));

    const lines = toUploadErrorLines(data);

    expect(lines).toHaveLength(21);
    expect(lines[20]).toBe('and 5 more');
  });
});
