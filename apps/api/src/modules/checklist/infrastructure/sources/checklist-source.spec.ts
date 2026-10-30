import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ChecklistDirSource } from './checklist-dir.source';
import { ChecklistHttpSource } from './checklist-http.source';
import { createChecklistSource } from './checklist-source.factory';

describe('createChecklistSource', () => {
  it('should read the local folder when both the folder and a URL are set', () => {
    expect(
      createChecklistSource({ CHECKLIST_SOURCE_DIR: ' /tmp/x ', CHECKLIST_SOURCE_URL: 'https://e.test' })
    ).toBeInstanceOf(ChecklistDirSource);
  });

  it('should read over HTTP when no folder is set', () => {
    expect(createChecklistSource({ CHECKLIST_SOURCE_DIR: '  ' })).toBeInstanceOf(ChecklistHttpSource);
  });
});

describe('ChecklistDirSource', () => {
  const root = mkdtempSync(join(tmpdir(), 'checklist-'));
  mkdirSync(join(root, 'lanes'));
  writeFileSync(join(root, 'lanes', 'size-s.md'), '# S');

  it('should read a file nested in the folder', async () => {
    await expect(new ChecklistDirSource(root).read('lanes/size-s.md')).resolves.toBe('# S');
  });

  it('should refuse a path that leaves the folder', async () => {
    await expect(new ChecklistDirSource(join(root, 'lanes')).read('../lanes-x.md')).rejects.toThrow(/outside/);
  });
});

describe('ChecklistHttpSource', () => {
  const respond = (body: string, init: ResponseInit = {}) =>
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(body, init));

  afterEach(() => jest.restoreAllMocks());

  it('should read the file under the base URL', async () => {
    const fetch = respond('# S');

    await expect(new ChecklistHttpSource('https://e.test/c/').read('lanes/size-s.md')).resolves.toBe('# S');
    expect(fetch.mock.calls[0][0]).toBe('https://e.test/c/lanes/size-s.md');
  });

  it('should throw on a status that is not OK, not return the error page', async () => {
    respond('404: Not Found', { status: 404 });

    await expect(new ChecklistHttpSource('https://e.test').read('x.md')).rejects.toThrow(/HTTP 404/);
  });

  it('should throw on a file larger than any checklist file', async () => {
    respond('x'.repeat(200_001));

    await expect(new ChecklistHttpSource('https://e.test').read('x.md')).rejects.toThrow(/too large/);
  });
});
