import { ChecklistDocKind } from '@prisma/client';
import { createHash } from 'node:crypto';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';
import { parsedFile } from '../../domain/__fixtures__/checklist.fixture';
import { IChecklistDocRepository } from '../ports/checklist-doc.repository.port';
import { IChecklistSource } from '../ports/checklist-source.port';
import { RefreshChecklistDocsCommand, RefreshChecklistDocsHandler } from './refresh-docs.command';

const LANE =
  '<!-- format: 2 -->\n# Checklist size S\n\n## 1. Discovery | BA\n\n### 1.1 Viết một câu\nAi làm: Owner · Ai kiểm: —\n\nOwner viết vấn đề.\n';
const LOOKUP = '<!-- format: 2 -->\n# Lookup\n\n## A. Chọn size\n\nTheo rủi ro.\n';
const sha = (content: string) => createHash('sha256').update(content).digest('hex');
const manifest = (lanes = [{ slug: 'size-s', title: 'Size S', path: 'lanes/size-s.md' }], format = 2) =>
  JSON.stringify({ format, lanes, lookup: 'lookup.md' });

describe('RefreshChecklistDocsHandler', () => {
  const setup = (files: Record<string, string>, existing: ChecklistDoc[] = []) => {
    const docs = {
      findAll: jest.fn(async () => existing),
      saveSync: jest.fn(),
    } as unknown as jest.Mocked<IChecklistDocRepository>;
    const source: jest.Mocked<IChecklistSource> = {
      read: jest.fn(async (path: string) => {
        if (path in files) return files[path];
        throw new Error(`404 ${path}`);
      }),
    };
    return { docs, source, handler: new RefreshChecklistDocsHandler(docs, source) };
  };
  const files = { 'manifest.json': manifest(), 'lanes/size-s.md': LANE, 'lookup.md': LOOKUP };

  it('should read the manifest, then save each listed lane under its manifest slug and title, and the lookup table', async () => {
    const { docs, source, handler } = setup(files);

    const result = await handler.execute(new RefreshChecklistDocsCommand(true));

    const paths = source.read.mock.calls.map(([path]) => path);
    expect(paths[0]).toBe('manifest.json');
    expect(paths.slice(1).sort()).toEqual(['lanes/size-s.md', 'lookup.md']);
    expect(result).toEqual({ created: ['size-s', 'lookup'], updated: [], unchanged: [], archived: [] });
    const [created] = docs.saveSync.mock.calls[0];
    expect(created.map((doc) => [doc.kind, doc.slug, doc.title])).toEqual([
      [ChecklistDocKind.TEMPLATE, 'size-s', 'Size S'],
      [ChecklistDocKind.LOOKUP, 'lookup', 'Lookup'],
    ]);
  });

  it('should archive a lane that left the manifest and leave the old project profiles alone', async () => {
    const oldLane = ChecklistDoc.create(parsedFile({ slug: 'checklist-size-l' }));
    const oldLookup = ChecklistDoc.create(parsedFile({ kind: ChecklistDocKind.LOOKUP, slug: 'bang-tra' }));
    const profile = ChecklistDoc.create(parsedFile({ kind: ChecklistDocKind.PROJECT, slug: 'portfolio' }));
    const { docs, handler } = setup(files, [oldLane, oldLookup, profile]);

    const result = await handler.execute(new RefreshChecklistDocsCommand(true));

    expect(result?.archived).toEqual(['checklist-size-l', 'bang-tra']);
    const [, changed] = docs.saveSync.mock.calls[0];
    expect(changed.map((doc) => [doc.slug, doc.isArchived])).toEqual([
      ['checklist-size-l', true],
      ['bang-tra', true],
    ]);
  });

  it('should report a doc as updated when its markdown changed and unchanged when it did not', async () => {
    const lane = ChecklistDoc.create(parsedFile({ slug: 'size-s', sourceHash: 'old-hash' }));
    const lookup = ChecklistDoc.create(
      parsedFile({ kind: ChecklistDocKind.LOOKUP, slug: 'lookup', title: 'Lookup', sourceHash: sha(LOOKUP) })
    );
    const { handler } = setup(files, [lane, lookup]);

    const result = await handler.execute(new RefreshChecklistDocsCommand(true));

    expect(result).toEqual({ created: [], updated: ['size-s'], unchanged: ['lookup'], archived: [] });
  });

  it.each([
    [
      'the manifest has an unknown format',
      { ...files, 'manifest.json': manifest(undefined, 3) },
      'CHECKLIST_UNSUPPORTED_FORMAT',
    ],
    [
      'a lane has an unknown format',
      { ...files, 'lanes/size-s.md': LANE.replace('format: 2', 'format: 9') },
      'CHECKLIST_UNSUPPORTED_FORMAT',
    ],
    [
      'a lane cannot be parsed',
      { ...files, 'lanes/size-s.md': '<!-- format: 2 -->\n# S\n\nNo phase.' },
      'CHECKLIST_INVALID_MARKDOWN',
    ],
    [
      'the manifest points outside the checklist folder',
      { ...files, 'manifest.json': manifest([{ slug: 'size-s', title: 'Size S', path: '../secrets.md' }]) },
      'CHECKLIST_INVALID_INPUT',
    ],
    [
      'the manifest lists one slug twice',
      {
        ...files,
        'manifest.json': manifest([
          { slug: 'size-s', title: 'Size S', path: 'lanes/size-s.md' },
          { slug: 'size-s', title: 'Size M', path: 'lanes/size-m.md' },
        ]),
      },
      'CHECKLIST_INVALID_INPUT',
    ],
    [
      'a lane path is the lookup path',
      { ...files, 'manifest.json': manifest([{ slug: 'size-s', title: 'Size S', path: 'lookup.md' }]) },
      'CHECKLIST_INVALID_INPUT',
    ],
    [
      'a lane item is longer than a run can save',
      { ...files, 'lanes/size-s.md': LANE.replace('Owner viết vấn đề.', 'x'.repeat(2001)) },
      'CHECKLIST_INVALID_MARKDOWN',
    ],
    ['the manifest is not JSON', { ...files, 'manifest.json': '<html>404</html>' }, 'CHECKLIST_INVALID_INPUT'],
    [
      'a listed file cannot be fetched',
      { 'manifest.json': manifest(), 'lookup.md': LOOKUP },
      'CHECKLIST_SOURCE_UNAVAILABLE',
    ],
  ])('should keep the current docs and reject the refresh when %s', async (_case, source, errorCode) => {
    const { docs, handler } = setup(source);

    await expect(handler.execute(new RefreshChecklistDocsCommand(true))).rejects.toMatchObject({ errorCode });
    expect(docs.saveSync).not.toHaveBeenCalled();
  });

  it('should answer 503 with the file when the source cannot be read, so the Owner sees why', async () => {
    const { handler } = setup({ 'manifest.json': manifest(), 'lookup.md': LOOKUP });

    await expect(handler.execute(new RefreshChecklistDocsCommand(true))).rejects.toMatchObject({
      statusCode: 503,
      errorCode: 'CHECKLIST_SOURCE_UNAVAILABLE',
      message: expect.stringContaining('lanes/size-s.md'),
    });
  });

  it('should name manifest.json in the error when the manifest breaks its schema', async () => {
    const { handler } = setup({
      ...files,
      'manifest.json': JSON.stringify({ format: 2, lanes: [], lookup: 'lookup.md' }),
    });

    await expect(handler.execute(new RefreshChecklistDocsCommand(true))).rejects.toThrow(/^manifest\.json: /);
  });

  it('should skip an automatic refresh within 10 minutes of the last one, but not a forced one', async () => {
    const { source, handler } = setup(files);
    await handler.execute(new RefreshChecklistDocsCommand(true));
    source.read.mockClear();

    const skipped = await handler.execute(new RefreshChecklistDocsCommand(false));
    expect(skipped).toBeNull();
    expect(source.read).not.toHaveBeenCalled();

    await handler.execute(new RefreshChecklistDocsCommand(true));
    expect(source.read).toHaveBeenCalled();
  });

  it('should share one read between two refreshes that run at once', async () => {
    const { source, handler } = setup(files);

    const [first, second] = await Promise.all([
      handler.execute(new RefreshChecklistDocsCommand(true)),
      handler.execute(new RefreshChecklistDocsCommand(true)),
    ]);

    expect(source.read.mock.calls.filter(([path]) => path === 'manifest.json')).toHaveLength(1);
    expect(second).toBe(first);
  });

  it('should retry an automatic refresh one minute after a failed one, not ten', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-30T10:00:00Z') });
    try {
      const { source, handler } = setup({ 'manifest.json': manifest(), 'lookup.md': LOOKUP });
      await expect(handler.execute(new RefreshChecklistDocsCommand(false))).rejects.toBeDefined();
      source.read.mockClear();

      jest.setSystemTime(new Date('2026-10-30T10:00:30Z'));
      expect(await handler.execute(new RefreshChecklistDocsCommand(false))).toBeNull();

      jest.setSystemTime(new Date('2026-10-30T10:01:01Z'));
      await expect(handler.execute(new RefreshChecklistDocsCommand(false))).rejects.toBeDefined();
      expect(source.read).toHaveBeenCalledWith('manifest.json');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should refresh automatically again once the last refresh is older than 10 minutes', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-30T10:00:00Z') });
    try {
      const { source, handler } = setup(files);
      await handler.execute(new RefreshChecklistDocsCommand(false));
      source.read.mockClear();

      jest.setSystemTime(new Date('2026-10-30T10:09:59Z'));
      expect(await handler.execute(new RefreshChecklistDocsCommand(false))).toBeNull();
      expect(source.read).not.toHaveBeenCalled();

      jest.setSystemTime(new Date('2026-10-30T10:10:01Z'));
      await handler.execute(new RefreshChecklistDocsCommand(false));

      expect(source.read).toHaveBeenCalledWith('manifest.json');
    } finally {
      jest.useRealTimers();
    }
  });
});
