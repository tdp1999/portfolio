import 'dotenv/config';

import { Test } from '@nestjs/testing';
import { RadarCommentsStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import { PrismaModule, PrismaService } from '../../../../shared/prisma';
import { RadarCommentsRepository } from './radar-comments.repository';

describe('RadarCommentsRepository (integration)', () => {
  let prisma: PrismaService;
  let repo: RadarCommentsRepository;
  const sourceId = IdentifierValue.v7();
  const itemId = IdentifierValue.v7();

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [RadarCommentsRepository],
    }).compile();
    prisma = mod.get(PrismaService);
    repo = mod.get(RadarCommentsRepository);
    await prisma.radarSource.create({
      data: { id: sourceId, url: `https://fb.test/${sourceId}`, displayName: 'Comments test source' },
    });
    await prisma.radarItem.create({
      data: {
        id: itemId,
        sourceId,
        externalId: itemId,
        provider: 'test',
        permalink: `https://fb.test/${itemId}`,
        authorName: 'test',
        publishedAt: new Date(),
        text: 'x',
        rawPayload: {},
      },
    });
  });

  afterAll(async () => {
    await prisma.radarItem.deleteMany({ where: { sourceId } });
    await prisma.radarSource.delete({ where: { id: sourceId } });
    await prisma.$disconnect();
  });

  it('should mark a failure without overwriting comments stored after the item was read', async () => {
    const stale = (await repo.findById(itemId))!;
    // A manual fetch lands between the read and the failure write.
    await prisma.radarItem.update({
      where: { id: itemId },
      data: { comments: [{ id: 'fresh' }], commentsFetchedCount: 1 },
    });

    await repo.saveCommentsFailure([stale.markCommentsFailed('Comments skipped')]);

    expect(await prisma.radarItem.findUnique({ where: { id: itemId } })).toMatchObject({
      comments: [{ id: 'fresh' }],
      commentsFetchedCount: 1,
      commentsStatus: RadarCommentsStatus.FAILED,
      commentsError: 'Comments skipped',
    });
  });
});
