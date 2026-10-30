import { ChecklistDocKind } from '@prisma/client';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';
import { ChecklistRun } from '../../domain/entities/checklist-run.entity';
import { parsedFile, templateContent } from '../../domain/__fixtures__/checklist.fixture';
import { IChecklistDocRepository } from '../ports/checklist-doc.repository.port';
import { IChecklistRunRepository } from '../ports/checklist-run.repository.port';
import { CreateChecklistRunCommand, CreateChecklistRunHandler } from './create-run.command';
import { SaveChecklistRunBodyCommand, SaveChecklistRunBodyHandler } from './save-run-body.command';

describe('CreateChecklistRunHandler', () => {
  const setup = (template: ChecklistDoc | null) => {
    const docs = {
      findBySlug: jest.fn(async (kind: ChecklistDocKind) => (kind === ChecklistDocKind.TEMPLATE ? template : null)),
    } as unknown as jest.Mocked<IChecklistDocRepository>;
    const runs = { add: jest.fn() } as unknown as jest.Mocked<IChecklistRunRepository>;
    return { runs, handler: new CreateChecklistRunHandler(docs, runs) };
  };

  it('should start a run from a project name alone, with no profile in the database', async () => {
    const { runs, handler } = setup(ChecklistDoc.create(parsedFile({ slug: 'size-l' })));

    await handler.execute(
      new CreateChecklistRunCommand({ name: 'CIMB-123', templateSlug: 'size-l', projectSlug: 'workbuddy-fsm' })
    );

    expect(runs.add.mock.calls[0][0].projectSlug).toBe('workbuddy-fsm');
  });

  it('should refuse a run when the template does not exist', async () => {
    const { runs, handler } = setup(null);

    await expect(
      handler.execute(new CreateChecklistRunCommand({ name: 'CIMB-123', templateSlug: 'ghost', projectSlug: 'x' }))
    ).rejects.toMatchObject({ errorCode: 'CHECKLIST_DOC_NOT_FOUND' });
    expect(runs.add).not.toHaveBeenCalled();
  });
});

describe('SaveChecklistRunBodyHandler', () => {
  it('should refuse the save when another save wins the race after the read', async () => {
    const run = ChecklistRun.create('CIMB-123', ChecklistDoc.create(parsedFile()), 'portfolio');
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
