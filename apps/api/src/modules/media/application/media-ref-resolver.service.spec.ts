import type { EditorDocument } from '@portfolio/shared/features/rte-core/image-refs';
import { MediaRefResolverService } from './media-ref-resolver.service';
import type { IMediaRepository } from './ports/media.repository.port';
import type { Media } from '../domain/entities/media.entity';

const media = (id: string, over: Partial<Record<'url' | 'altText' | 'width' | 'height', unknown>> = {}): Media =>
  ({
    id,
    url: over.url ?? `https://cdn/${id}.png`,
    altText: 'altText' in over ? (over.altText as string | null) : `alt-${id}`,
    width: 'width' in over ? (over.width as number | null) : 100,
    height: 'height' in over ? (over.height as number | null) : 80,
  }) as unknown as Media;

const docWith = (ids: string[]): EditorDocument =>
  ({
    schemaVersion: 1,
    content: { type: 'doc', content: ids.map((id) => ({ type: 'imageRef', attrs: { imageId: id } })) },
  }) as unknown as EditorDocument;

describe('MediaRefResolverService', () => {
  let repo: { findById: jest.Mock };
  let service: MediaRefResolverService;

  beforeEach(() => {
    repo = { findById: jest.fn() };
    service = new MediaRefResolverService(repo as unknown as IMediaRepository);
  });

  it('returns an empty map when no documents reference media', async () => {
    const map = await service.resolveForDocuments([docWith([]), null, undefined]);
    expect(map).toEqual({});
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('resolves referenced ids into url/alt/width/height entries', async () => {
    repo.findById.mockImplementation((id: string) => Promise.resolve(media(id)));
    const map = await service.resolveForDocuments([docWith(['a'])]);
    expect(map).toEqual({ a: { url: 'https://cdn/a.png', alt: 'alt-a', width: 100, height: 80 } });
  });

  it('de-duplicates ids across both locale documents (one lookup per id)', async () => {
    repo.findById.mockImplementation((id: string) => Promise.resolve(media(id)));
    await service.resolveForDocuments([docWith(['a', 'b']), docWith(['a'])]);
    expect(repo.findById).toHaveBeenCalledTimes(2);
  });

  it('omits ids that resolve to no media (deleted) from the map', async () => {
    repo.findById.mockImplementation((id: string) => Promise.resolve(id === 'gone' ? null : media(id)));
    const map = await service.resolveForDocuments([docWith(['ok', 'gone'])]);
    expect(map).toHaveProperty('ok');
    expect(map).not.toHaveProperty('gone');
  });

  it('coerces a null altText to an empty alt string', async () => {
    repo.findById.mockResolvedValue(media('a', { altText: null }));
    const map = await service.resolveForDocuments([docWith(['a'])]);
    expect(map['a'].alt).toBe('');
  });

  it('preserves null width/height (unknown dimensions)', async () => {
    repo.findById.mockResolvedValue(media('a', { width: null, height: null }));
    const map = await service.resolveForDocuments([docWith(['a'])]);
    expect(map['a'].width).toBeNull();
    expect(map['a'].height).toBeNull();
  });
});
