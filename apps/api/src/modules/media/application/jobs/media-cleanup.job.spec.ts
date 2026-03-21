import { CommandBus } from '@nestjs/cqrs';
import { MediaCleanupJob } from './media-cleanup.job';
import { IMediaRepository } from '../ports/media.repository.port';
import { HardDeleteMediaCommand } from '../commands';
import { Media } from '../../domain/entities/media.entity';
import { IMediaProps } from '../../domain/media.types';

describe('MediaCleanupJob', () => {
  let job: MediaCleanupJob;
  let repo: jest.Mocked<IMediaRepository>;
  let commandBus: jest.Mocked<CommandBus>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const makeMedia = (id: string, deletedDaysAgo: number): Media => {
    const deletedAt = new Date();
    deletedAt.setDate(deletedAt.getDate() - deletedDaysAgo);

    const props: IMediaProps = {
      id,
      originalFilename: `file-${id}.jpg`,
      mimeType: 'image/jpeg',
      publicId: `general/${id}`,
      url: `https://cdn.example.com/${id}.jpg`,
      format: 'jpg',
      bytes: 1024,
      width: 100,
      height: 100,
      altText: null,
      caption: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      createdById: userId,
      updatedById: userId,
      deletedAt,
      deletedById: userId,
    };

    return Media.load(props);
  };

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      hardDelete: jest.fn(),
      findById: jest.fn(),
      findByPublicId: jest.fn(),
      findByMimeTypePrefix: jest.fn(),
      findOrphans: jest.fn().mockResolvedValue([]),
      findExpiredSoftDeleted: jest.fn().mockResolvedValue([]),
      findDeleted: jest.fn(),
      findAll: jest.fn(),
      getStorageStats: jest.fn(),
    };

    commandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;

    job = new MediaCleanupJob(repo, commandBus);
  });

  describe('handleExpiredSoftDeletes', () => {
    it('should do nothing when no expired media found', async () => {
      repo.findExpiredSoftDeleted.mockResolvedValue([]);

      await job.handleExpiredSoftDeletes();

      expect(repo.findExpiredSoftDeleted).toHaveBeenCalledWith(expect.any(Date));
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('should dispatch HardDeleteMediaCommand for each expired media', async () => {
      const media1 = makeMedia('id-1', 31);
      const media2 = makeMedia('id-2', 45);
      repo.findExpiredSoftDeleted.mockResolvedValue([media1, media2]);

      await job.handleExpiredSoftDeletes();

      expect(commandBus.execute).toHaveBeenCalledTimes(2);
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(HardDeleteMediaCommand));
    });

    it('should pass cutoff date 30 days in the past', async () => {
      const before = new Date();
      before.setDate(before.getDate() - 30);

      await job.handleExpiredSoftDeletes();

      const calledWith = repo.findExpiredSoftDeleted.mock.calls[0][0] as Date;
      // Allow 1 second tolerance
      expect(Math.abs(calledWith.getTime() - before.getTime())).toBeLessThan(1000);
    });

    it('should continue processing when individual deletes fail', async () => {
      const media1 = makeMedia('id-1', 31);
      const media2 = makeMedia('id-2', 45);
      repo.findExpiredSoftDeleted.mockResolvedValue([media1, media2]);

      commandBus.execute.mockRejectedValueOnce(new Error('Storage down')).mockResolvedValueOnce(undefined);

      await job.handleExpiredSoftDeletes();

      expect(commandBus.execute).toHaveBeenCalledTimes(2);
    });

    it('should process in batches of 50', async () => {
      const media = Array.from({ length: 75 }, (_, i) => makeMedia(`id-${i}`, 31));
      repo.findExpiredSoftDeleted.mockResolvedValue(media);

      await job.handleExpiredSoftDeletes();

      expect(commandBus.execute).toHaveBeenCalledTimes(75);
    });
  });

  describe('handleOrphanDetection', () => {
    it('should do nothing when no orphans found', async () => {
      repo.findOrphans.mockResolvedValue([]);

      await job.handleOrphanDetection();

      expect(repo.findOrphans).toHaveBeenCalled();
    });

    it('should log orphaned media without deleting', async () => {
      const orphan = makeMedia('orphan-1', 0);
      repo.findOrphans.mockResolvedValue([orphan]);

      await job.handleOrphanDetection();

      expect(repo.findOrphans).toHaveBeenCalled();
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });
});
