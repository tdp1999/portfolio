import { CommandBus } from '@nestjs/cqrs';
import { ReorderAboutFailuresCommand, ReorderAboutFailuresHandler } from './reorder-about-failures.command';
import { IAboutFailureRepository } from '../ports/about-failure.repository.port';
import { AboutFailure } from '../../domain/entities/about-failure.entity';

describe('ReorderAboutFailuresHandler', () => {
  const userId = '0192f000-0000-7000-8000-000000000999';
  const idA = '0192f000-0000-7000-8000-00000000000a';
  const idB = '0192f000-0000-7000-8000-00000000000b';
  const idC = '0192f000-0000-7000-8000-00000000000c';

  let repo: jest.Mocked<IAboutFailureRepository>;
  let commandBus: jest.Mocked<CommandBus>;
  let handler: ReorderAboutFailuresHandler;

  const loadFailure = (id: string, order: number) =>
    AboutFailure.load({
      id,
      order,
      year: 2021,
      context: { en: `ctx ${id}`, vi: '' },
      decision: { en: `decision ${id}`, vi: '' },
      consequence: { en: `consequence ${id}`, vi: '' },
      lesson: { en: `lesson ${id}`, vi: '' },
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
    handler = new ReorderAboutFailuresHandler(repo, commandBus);
  });

  it('persists new order values matching array position', async () => {
    repo.findAll.mockResolvedValue([loadFailure(idA, 0), loadFailure(idB, 1), loadFailure(idC, 2)]);

    await handler.execute(new ReorderAboutFailuresCommand({ ids: [idC, idA, idB] }, userId));

    expect(repo.reorder).toHaveBeenCalledWith([
      { id: idC, order: 0 },
      { id: idA, order: 1 },
      { id: idB, order: 2 },
    ]);
    expect(commandBus.execute).toHaveBeenCalledTimes(1); // bumps Profile.contentUpdatedAt
  });

  it('rejects payload with missing id', async () => {
    repo.findAll.mockResolvedValue([loadFailure(idA, 0), loadFailure(idB, 1), loadFailure(idC, 2)]);

    await expect(handler.execute(new ReorderAboutFailuresCommand({ ids: [idA, idB] }, userId))).rejects.toMatchObject({
      errorCode: 'ABOUT_FAILURE_REORDER_ID_MISMATCH',
    });
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('rejects payload with unknown id', async () => {
    repo.findAll.mockResolvedValue([loadFailure(idA, 0), loadFailure(idB, 1)]);

    await expect(
      handler.execute(new ReorderAboutFailuresCommand({ ids: [idA, '0192f000-0000-7000-8000-0000000000ff'] }, userId))
    ).rejects.toMatchObject({ errorCode: 'ABOUT_FAILURE_REORDER_ID_MISMATCH' });
    expect(repo.reorder).not.toHaveBeenCalled();
  });

  it('rejects payload with duplicates', async () => {
    repo.findAll.mockResolvedValue([loadFailure(idA, 0), loadFailure(idB, 1)]);

    await expect(handler.execute(new ReorderAboutFailuresCommand({ ids: [idA, idA] }, userId))).rejects.toMatchObject({
      errorCode: 'ABOUT_FAILURE_REORDER_ID_MISMATCH',
    });
  });

  it('rejects empty ids array', async () => {
    await expect(handler.execute(new ReorderAboutFailuresCommand({ ids: [] }, userId))).rejects.toMatchObject({
      errorCode: 'ABOUT_FAILURE_INVALID_INPUT',
    });
  });
});
