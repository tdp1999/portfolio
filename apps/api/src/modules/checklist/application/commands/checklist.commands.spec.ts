import { ChecklistDocKind } from '@prisma/client';
import { createHash } from 'node:crypto';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';
import { ChecklistRun } from '../../domain/entities/checklist-run.entity';
import { parsedFile, templateContent } from '../../domain/__fixtures__/checklist.fixture';
import { IChecklistDocRepository } from '../ports/checklist-doc.repository.port';
import { IChecklistRunRepository } from '../ports/checklist-run.repository.port';
import { CreateChecklistRunCommand, CreateChecklistRunHandler } from './create-run.command';
import { SaveChecklistRunBodyCommand, SaveChecklistRunBodyHandler } from './save-run-body.command';
import { SyncChecklistDocsCommand, SyncChecklistDocsHandler } from './sync-docs.command';

const LANE =
  '# Checklist làn S\n\n## 1. Discovery | BA\n\n| ✔ | Việc | Ai làm | Ai kiểm |\n| --- | --- | --- | --- |\n| [ ] | Một câu | Owner | — |\n';
const LOOKUP = '# Bảng tra\n\n## A. Chọn làn\n\nTheo rủi ro.\n';
const sha = (content: string) => createHash('sha256').update(content).digest('hex');

describe('SyncChecklistDocsHandler', () => {
  const setup = (existing: ChecklistDoc[] = []) => {
    const docs = {
      findAll: jest.fn(async () => existing),
      saveSync: jest.fn(),
    } as unknown as jest.Mocked<IChecklistDocRepository>;
    return { docs, handler: new SyncChecklistDocsHandler(docs) };
  };

  it('should write nothing when one file in the push cannot be parsed', async () => {
    const { docs, handler } = setup();
    const files = [
      { path: 'checklist-lane-s.md', content: LANE },
      { path: 'checklist-lane-m.md', content: '# Checklist làn M\n\nNo phase.' },
    ];

    await expect(handler.execute(new SyncChecklistDocsCommand({ files }))).rejects.toMatchObject({
      errorCode: 'CHECKLIST_INVALID_MARKDOWN',
    });
    expect(docs.saveSync).not.toHaveBeenCalled();
  });

  it('should archive a doc whose file is missing from the push', async () => {
    const lookup = ChecklistDoc.create(parsedFile({ kind: ChecklistDocKind.LOOKUP, slug: 'bang-tra' }));
    const { docs, handler } = setup([lookup]);

    const result = await handler.execute(
      new SyncChecklistDocsCommand({ files: [{ path: 'checklist-lane-s.md', content: LANE }] })
    );

    expect(result).toEqual({ created: ['checklist-lane-s'], updated: [], unchanged: [], archived: ['bang-tra'] });
    const [created, changed] = docs.saveSync.mock.calls[0];
    expect(created.map((doc) => doc.slug)).toEqual(['checklist-lane-s']);
    expect(changed.map((doc) => [doc.slug, doc.isArchived])).toEqual([['bang-tra', true]]);
  });

  it('should report a doc as updated when its markdown changed and unchanged when it did not', async () => {
    const lane = ChecklistDoc.create(parsedFile({ slug: 'checklist-lane-s', sourceHash: 'old-hash' }));
    const lookup = ChecklistDoc.create(
      parsedFile({ kind: ChecklistDocKind.LOOKUP, slug: 'bang-tra', sourceHash: sha(LOOKUP) })
    );
    const { docs, handler } = setup([lane, lookup]);
    const files = [
      { path: 'checklist-lane-s.md', content: LANE },
      { path: 'bang-tra.md', content: LOOKUP },
    ];

    const result = await handler.execute(new SyncChecklistDocsCommand({ files }));

    expect(result).toEqual({ created: [], updated: ['checklist-lane-s'], unchanged: ['bang-tra'], archived: [] });
    const [, changed] = docs.saveSync.mock.calls[0];
    expect(changed.map((doc) => [doc.slug, doc.sourceHash])).toEqual([['checklist-lane-s', sha(LANE)]]);
  });

  it('should refuse a push where two files map to the same doc', async () => {
    const { docs, handler } = setup();
    const files = [
      { path: 'checklist-lane-s.md', content: LANE },
      { path: 'old/checklist-lane-s.md', content: LANE },
    ];

    await expect(handler.execute(new SyncChecklistDocsCommand({ files }))).rejects.toMatchObject({
      errorCode: 'CHECKLIST_INVALID_INPUT',
    });
    expect(docs.saveSync).not.toHaveBeenCalled();
  });

  it('should refuse a title longer than the column instead of failing in the database', async () => {
    const { handler } = setup();
    const content = `# ${'x'.repeat(201)}\n\n## A. Chọn làn\n\nTheo rủi ro.\n`;

    await expect(
      handler.execute(new SyncChecklistDocsCommand({ files: [{ path: 'bang-tra.md', content }] }))
    ).rejects.toMatchObject({ errorCode: 'CHECKLIST_INVALID_INPUT', message: expect.stringContaining('bang-tra.md') });
  });

  it('should refuse a file that is not a checklist, the lookup table or a profile', async () => {
    const { handler } = setup();
    const files = [
      { path: 'bang-tra.md', content: LOOKUP },
      { path: 'README.md', content: '# Workflow' },
    ];

    await expect(handler.execute(new SyncChecklistDocsCommand({ files }))).rejects.toMatchObject({
      errorCode: 'CHECKLIST_UNKNOWN_FILE',
    });
  });
});

describe('CreateChecklistRunHandler', () => {
  it('should refuse a run when the project profile does not exist', async () => {
    const template = ChecklistDoc.create(parsedFile());
    const docs = {
      findBySlug: jest.fn(async (kind: ChecklistDocKind) => (kind === ChecklistDocKind.TEMPLATE ? template : null)),
    } as unknown as jest.Mocked<IChecklistDocRepository>;
    const runs = { add: jest.fn() } as unknown as jest.Mocked<IChecklistRunRepository>;
    const handler = new CreateChecklistRunHandler(docs, runs);

    await expect(
      handler.execute(
        new CreateChecklistRunCommand({ name: 'CIMB-123', templateSlug: 'checklist-lane-l', projectSlug: 'ghost' })
      )
    ).rejects.toMatchObject({ errorCode: 'CHECKLIST_DOC_NOT_FOUND' });
    expect(runs.add).not.toHaveBeenCalled();
  });
});

describe('SaveChecklistRunBodyHandler', () => {
  it('should refuse the save when another save wins the race after the read', async () => {
    const project = ChecklistDoc.create(parsedFile({ kind: ChecklistDocKind.PROJECT, slug: 'portfolio' }));
    const run = ChecklistRun.create('CIMB-123', ChecklistDoc.create(parsedFile()), project);
    const runs = {
      findById: jest.fn(async () => run),
      saveBody: jest.fn(async () => false),
    } as unknown as jest.Mocked<IChecklistRunRepository>;
    const handler = new SaveChecklistRunBodyHandler(runs);

    await expect(
      handler.execute(new SaveChecklistRunBodyCommand(run.id, { version: 1, body: templateContent() }))
    ).rejects.toMatchObject({ errorCode: 'CHECKLIST_RUN_VERSION_CONFLICT' });
  });
});
