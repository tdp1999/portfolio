import { CommandBus } from '@nestjs/cqrs';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';
import { parsedFile } from '../../domain/__fixtures__/checklist.fixture';
import { RefreshChecklistDocsCommand } from '../commands/refresh-docs.command';
import { IChecklistDocRepository } from '../ports/checklist-doc.repository.port';
import { ListChecklistDocsHandler, ListChecklistDocsQuery } from './doc.queries';

describe('ListChecklistDocsHandler', () => {
  const setup = (refresh: Promise<unknown>) => {
    const repo = {
      findLive: jest.fn(async () => [ChecklistDoc.create(parsedFile({ slug: 'size-s' }))]),
    } as unknown as jest.Mocked<IChecklistDocRepository>;
    const commandBus = { execute: jest.fn(() => refresh) } as unknown as jest.Mocked<CommandBus>;
    return { commandBus, handler: new ListChecklistDocsHandler(repo, commandBus) };
  };

  it('should start an automatic refresh and answer from the stored docs without waiting for it', async () => {
    const { commandBus, handler } = setup(new Promise(() => undefined));

    const docs = await handler.execute(new ListChecklistDocsQuery({}));

    expect(docs.map((doc) => doc.slug)).toEqual(['size-s']);
    expect(commandBus.execute).toHaveBeenCalledWith(new RefreshChecklistDocsCommand(false));
  });

  it('should still answer from the stored docs when the refresh fails', async () => {
    const { handler } = setup(Promise.reject(new Error('source down')));

    await expect(handler.execute(new ListChecklistDocsQuery({}))).resolves.toHaveLength(1);
  });
});
