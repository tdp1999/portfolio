import { CommandBus } from '@nestjs/cqrs';
import { ReorderAboutPrinciplesCommand, ReorderAboutPrinciplesHandler } from './reorder-about-principles.command';
import { IAboutPrincipleRepository } from '../ports/about-principle.repository.port';
import { AboutPrinciple } from '../../domain/entities/about-principle.entity';

describe('ReorderAboutPrinciplesHandler', () => {
  const userId = '0192f000-0000-7000-8000-000000000999';
  const idA = '0192f000-0000-7000-8000-00000000000a';
  const idB = '0192f000-0000-7000-8000-00000000000b';
  const idC = '0192f000-0000-7000-8000-00000000000c';

  let repo: jest.Mocked<IAboutPrincipleRepository>;
  let commandBus: jest.Mocked<CommandBus>;
  let handler: ReorderAboutPrinciplesHandler;

  const loadPrinciple = (id: string, order: number) =>
    AboutPrinciple.load({
      id,
      order,
      claim: { en: `claim ${id}`, vi: '' },
      expansion: { en: `expansion ${id}`, vi: '' },
      isPublished: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reorder: jest.fn(),
    };
    commandBus = { execute: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<CommandBus>;
    handler = new ReorderAboutPrinciplesHandler(repo, commandBus);
  });

  it('persists new order values matching array position', async () => {
    repo.findAll.mockResolvedValue([loadPrinciple(idA, 0), loadPrinciple(idB, 1), loadPrinciple(idC, 2)]);

    await handler.execute(new ReorderAboutPrinciplesCommand({ ids: [idC, idA, idB] }, userId));

    expect(repo.reorder).toHaveBeenCalledWith([
      { id: idC, order: 0 },
      { id: idA, order: 1 },
      { id: idB, order: 2 },
    ]);
    expect(commandBus.execute).toHaveBeenCalledTimes(1); // bumps Profile.contentUpdatedAt
  });

  it('rejects payload with missing id', async () => {
    repo.findAll.mockResolvedValue([loadPrinciple(idA, 0), loadPrinciple(idB, 1), loadPrinciple(idC, 2)]);

    await expect(handler.execute(new ReorderAboutPrinciplesCommand({ ids: [idA, idB] }, userId))).rejects.toMatchObject(
      { errorCode: 'ABOUT_PRINCIPLE_REORDER_ID_MISMATCH' }
    );
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('rejects payload with unknown id', async () => {
    repo.findAll.mockResolvedValue([loadPrinciple(idA, 0), loadPrinciple(idB, 1)]);

    await expect(
      handler.execute(new ReorderAboutPrinciplesCommand({ ids: [idA, '0192f000-0000-7000-8000-0000000000ff'] }, userId))
    ).rejects.toMatchObject({ errorCode: 'ABOUT_PRINCIPLE_REORDER_ID_MISMATCH' });
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('rejects payload with duplicates', async () => {
    repo.findAll.mockResolvedValue([loadPrinciple(idA, 0), loadPrinciple(idB, 1)]);

    await expect(handler.execute(new ReorderAboutPrinciplesCommand({ ids: [idA, idA] }, userId))).rejects.toMatchObject(
      { errorCode: 'ABOUT_PRINCIPLE_REORDER_ID_MISMATCH' }
    );
  });

  it('rejects empty ids array', async () => {
    await expect(handler.execute(new ReorderAboutPrinciplesCommand({ ids: [] }, userId))).rejects.toMatchObject({
      errorCode: 'ABOUT_PRINCIPLE_INVALID_INPUT',
    });
  });
});
