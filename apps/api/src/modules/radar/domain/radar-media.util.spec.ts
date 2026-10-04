import { applyImageResults, carryOverStoredMedia } from './radar-media.util';
import { RadarMedia } from './radar.types';

const media = (overrides: Partial<RadarMedia>): RadarMedia => ({
  type: 'photo',
  url: 'https://cdn.fb/new.jpg',
  thumbnailUrl: null,
  width: null,
  height: null,
  ocrText: null,
  externalId: 'photo-1',
  storedUrl: null,
  storedExternalId: null,
  storageStatus: 'pending',
  storageError: null,
  ...overrides,
});

describe('carryOverStoredMedia', () => {
  it('should keep the stored copy of a photo matched by id while taking the freshly signed URL', () => {
    const previous = [
      media({
        url: 'https://cdn.fb/old.jpg',
        storedUrl: 'https://res/x.jpg',
        storedExternalId: 'radar/x',
        storageStatus: 'stored',
      }),
    ];

    const {
      value: [result],
    } = carryOverStoredMedia(previous, [media({})]);

    expect(result).toMatchObject({
      url: 'https://cdn.fb/new.jpg',
      storedUrl: 'https://res/x.jpg',
      storedExternalId: 'radar/x',
      storageStatus: 'stored',
    });
  });

  it('should leave previously failed and brand-new photos pending so they are retried', () => {
    const previous = [media({ storageStatus: 'failed', storageError: 'Timed out' })];

    const { value: result } = carryOverStoredMedia(previous, [media({}), media({ externalId: 'photo-2' })]);

    expect(result.map((m) => m.storageStatus)).toEqual(['pending', 'pending']);
    expect(result[0].storageError).toBeNull();
  });

  it('should report stored photos the new capture no longer contains as orphaned', () => {
    const previous = [
      media({
        externalId: 'gone',
        storedUrl: 'https://res/g.jpg',
        storedExternalId: 'radar/g',
        storageStatus: 'stored',
      }),
    ];

    expect(carryOverStoredMedia(previous, [media({})]).orphaned).toEqual(['radar/g']);
  });
});

describe('applyImageResults', () => {
  it('should apply results only to still-pending photos and return unapplied uploads as orphans', () => {
    const current = [
      media({ externalId: 'a' }),
      media({ externalId: 'b', storageStatus: 'stored', storedExternalId: 'radar/b-old', storedUrl: 'x' }),
    ];

    const merged = applyImageResults(
      current,
      [],
      [
        { key: 'a', outcome: 'stored', storedUrl: 'https://res/a.jpg', storedExternalId: 'radar/a' },
        { key: 'b', outcome: 'stored', storedUrl: 'https://res/b.jpg', storedExternalId: 'radar/b-new' },
        { key: 'removed', outcome: 'failed', error: 'x' },
      ]
    );

    expect(merged.media.map((m) => m.storedExternalId)).toEqual(['radar/a', 'radar/b-old']);
    expect(merged.orphaned).toEqual(['radar/b-new']);
  });
});
