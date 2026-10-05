import { UrlFileNamePipe } from './url-file-name.pipe';

describe('UrlFileNamePipe', () => {
  const pipe = new UrlFileNamePipe();

  it('returns the last path segment without the query string', () => {
    expect(pipe.transform('https://cdn.example.com/certs/aws.pdf?v=2')).toBe('aws.pdf');
  });

  it('falls back to the whole URL when the last segment is empty', () => {
    expect(pipe.transform('https://cdn.example.com/certs/')).toBe('https://cdn.example.com/certs/');
  });
});
