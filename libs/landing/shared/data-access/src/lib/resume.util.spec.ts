import { resolveResume } from './resume.util';
import type { ResumeUrls } from '@portfolio/shared/types';

const en = { url: 'https://cdn.example/cv-en.pdf', name: 'CV EN' };
const vi = { url: 'https://cdn.example/cv-vi.pdf', name: 'CV VI' };

describe('resolveResume', () => {
  it('returns nothing when the profile carries no resume at all', () => {
    expect(resolveResume(undefined, 'en')).toEqual({ url: '', fallbackLocale: null });
    expect(resolveResume(null, 'vi')).toEqual({ url: '', fallbackLocale: null });
    expect(resolveResume({} as ResumeUrls, 'en')).toEqual({ url: '', fallbackLocale: null });
  });

  it('prefers the reader own language and flags no fallback', () => {
    const urls = { en, vi } as ResumeUrls;
    expect(resolveResume(urls, 'en')).toEqual({ url: en.url, fallbackLocale: null });
    expect(resolveResume(urls, 'vi')).toEqual({ url: vi.url, fallbackLocale: null });
  });

  it('hands a vi reader the en file rather than hiding the link, and says so', () => {
    expect(resolveResume({ en } as ResumeUrls, 'vi')).toEqual({ url: en.url, fallbackLocale: 'en' });
  });

  it('hands an en reader the vi file rather than hiding the link, and says so', () => {
    expect(resolveResume({ vi } as ResumeUrls, 'en')).toEqual({ url: vi.url, fallbackLocale: 'vi' });
  });

  it('treats an entry with an empty url as absent', () => {
    const urls = { en: { url: '', name: '' }, vi } as ResumeUrls;
    expect(resolveResume(urls, 'en')).toEqual({ url: vi.url, fallbackLocale: 'vi' });
  });
});
