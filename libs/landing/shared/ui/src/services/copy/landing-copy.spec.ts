import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Locale } from '@portfolio/shared/types';
import { LandingCopyService } from './landing-copy.service';
import { LANDING_COPY } from './landing-copy.data';
import { resolveCopy, resolveFrom } from './landing-copy.util';
import { LandingLocaleService } from '../locale';
import { LandingCopyPipe } from '../../pipes/landing-copy.pipe';

/**
 * The dictionary itself is data, so the tests that matter are about the
 * *resolution* contract: which string comes back for which locale, and what
 * happens when an entry is partially filled. Every landing surface depends on
 * that contract holding, so it is asserted directly rather than through a host
 * component.
 */
describe('resolveCopy', () => {
  it('returns the requested locale', () => {
    expect(resolveCopy('contact.form.submit.idle', 'en')).toBe('Send message');
    expect(resolveCopy('contact.form.submit.idle', 'vi')).toBe('Gửi tin nhắn');
  });

  it('falls back to en when the vi value is missing', () => {
    expect(resolveFrom({ 'x.y': { en: 'English only', vi: '' } }, 'x.y', 'vi')).toBe('English only');
  });

  it('falls back to vi when the en value is missing', () => {
    expect(resolveFrom({ 'x.y': { en: '', vi: 'Chỉ có tiếng Việt' } }, 'x.y', 'en')).toBe('Chỉ có tiếng Việt');
  });

  it('returns the key itself when the entry is unknown', () => {
    // Surfacing the key beats rendering an empty node — a missing string is
    // then visible in the UI instead of silently collapsing the layout.
    expect(resolveCopy('nope.not.here' as never, 'en')).toBe('nope.not.here');
  });

  describe('slot interpolation', () => {
    it('fills every slot from the values object', () => {
      expect(resolveCopy('a11y.slide.position', 'en', { n: 2, total: 7 })).toBe('2 of 7');
      expect(resolveCopy('a11y.slide.position', 'vi', { n: 2, total: 7 })).toBe('2 trong 7');
    });

    it('accepts numbers without a String() at the call site', () => {
      expect(resolveCopy('blog.readTime', 'en', { n: 6 })).toContain('6');
    });

    it('leaves a {{double-brace}} sequence alone', () => {
      // `/document-engine` describes its own template syntax in prose. The inner
      // `{customer_name}` is product copy, not a slot — filling it would rewrite
      // the very thing the sentence is pointing at.
      const body = resolveCopy('documentEngine.preset.field.hint', 'en');
      expect(body).toContain('{{customer_name}}');
    });

    it('leaves an unfilled slot visible rather than blank', () => {
      // Same reasoning as returning the key for a missing entry: a hole that
      // shows is a hole that gets fixed.
      expect(resolveCopy('a11y.slide.position', 'en', { n: 2 } as never)).toBe('2 of {total}');
    });

    it('rejects a misspelled or missing slot at compile time', () => {
      // @ts-expect-error — the string says {n} and {total}; {count} is not a slot.
      resolveCopy('a11y.slide.position', 'en', { n: 1, count: 7 });
      // @ts-expect-error — {total} is required, not optional.
      resolveCopy('a11y.slide.position', 'en', { n: 1 });
      // @ts-expect-error — this entry has no slots at all.
      resolveCopy('common.copyLink', 'en', { n: 1 });
    });
  });

  it('has no entry that is empty in both locales', () => {
    const empty = Object.entries(LANDING_COPY)
      .filter(([, v]) => !v.en?.trim() && !v.vi?.trim())
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it('has no em-dash or en-dash in any value', () => {
    // Two separate reasons, one check:
    // - em-dash (U+2014) reads as an AI tell, so it is banned from copy;
    // - en-dash (U+2013) is visually confusable with a plain hyphen in source
    //   and trips the editor's ambiguous-character warning. Ranges spell the
    //   word out instead ("10 to 5000 characters").
    const offenders = Object.entries(LANDING_COPY)
      .filter(([, v]) => /[–—]/.test(v.en) || /[–—]/.test(v.vi))
      .map(([k]) => k);
    expect(offenders).toEqual([]);
  });

  it('keeps the same {placeholder} set in both locales', () => {
    // A few entries carry interpolation slots the call site fills in
    // (`Team of {n}` → `Nhóm {n} người`). Dropping a slot on one side is silent:
    // the sentence still renders, just missing the number it was built around.
    // `{{double}}` is matched first so it is consumed and discarded — it is
    // product syntax quoted in prose, not a slot. Same split as `fillSlots`.
    const slots = (s: string) =>
      [...s.matchAll(/\{\{\w+\}\}|\{(\w+)\}/g)]
        .map((m) => m[1])
        .filter((name): name is string => name !== undefined)
        .sort();
    const offenders = Object.entries(LANDING_COPY)
      .filter(([, v]) => slots(v.en).join() !== slots(v.vi).join())
      .map(([k]) => k);
    expect(offenders).toEqual([]);
  });
});

describe('LandingCopyService', () => {
  let service: LandingCopyService;
  let locale: LandingLocaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    locale = TestBed.inject(LandingLocaleService);
    service = TestBed.inject(LandingCopyService);
  });

  it('tracks the global locale signal', () => {
    locale.setLocale('en');
    const label = service.t('contact.form.submit.idle');
    expect(label()).toBe('Send message');

    locale.setLocale('vi');
    expect(label()).toBe('Gửi tin nhắn');
  });

  it('honours a locale override without touching global state', () => {
    // Legal pages drive locale from `?lang=`, not the site-wide toggle.
    locale.setLocale('en');
    const overridden = service.t('contact.form.submit.idle', signal<Locale>('vi'));

    expect(overridden()).toBe('Gửi tin nhắn');
    expect(locale.locale()).toBe('en');
  });
});

describe('LandingCopyPipe', () => {
  it('resolves a key for the locale it is given', () => {
    const pipe = new LandingCopyPipe();
    expect(pipe.transform('contact.form.submit.idle', 'en')).toBe('Send message');
    expect(pipe.transform('contact.form.submit.idle', 'vi')).toBe('Gửi tin nhắn');
  });
});
