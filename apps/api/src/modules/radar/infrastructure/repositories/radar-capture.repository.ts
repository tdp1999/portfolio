import { Injectable } from '@nestjs/common';
import { Prisma, RadarRunFlow, RadarStatus } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

import {
  IRadarCaptureRepository,
  SaveCaptureInput,
  SaveCapturePageInput,
  SaveCaptureResult,
} from '../../application/ports/radar-capture.repository.port';
import { carryOverSharedPostMedia, carryOverStoredMedia } from '../../domain/radar-media.util';
import { NormalizedRadarItem } from '../../domain/radar.types';
import { PrismaService } from '../../../../shared/prisma';

/** ~1,100 row writes for a 6-month backfill; Prisma's 5 s interactive default is too short. */
const TRANSACTION_TIMEOUT_MS = 60_000;

const json = (value: unknown) => value as Prisma.InputJsonValue;

/** Fields a re-capture refreshes. Identity, work status and enrichment are left alone. */
const contentOf = (item: NormalizedRadarItem, runId: string, capturedAt: Date) => ({
  kind: item.kind,
  permalink: item.permalink,
  authorName: item.authorName,
  authorExternalId: item.authorExternalId,
  publishedAt: item.publishedAt,
  text: item.text,
  media: json(item.media),
  links: json(item.links),
  sharedPost: item.sharedPost ? json(item.sharedPost) : Prisma.DbNull,
  engagement: json(item.engagement),
  rawPayload: json(item.rawPayload),
  lastRunId: runId,
  capturedAt,
});

type Tx = Prisma.TransactionClient;

@Injectable()
export class RadarCaptureRepository implements IRadarCaptureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveCapture(input: SaveCaptureInput): Promise<SaveCaptureResult> {
    const { runId, sourceId, items } = input;
    const capturedAt = new Date();

    return this.prisma.$transaction(
      async (tx) => {
        const { known, fresh, repeat } = await lockAndSplit(tx, sourceId, items);

        // The run row must exist before items reference it through lastRunId.
        await tx.radarRun.create({
          data: {
            id: runId,
            sourceId,
            flow: RadarRunFlow.MANUAL,
            status: RadarStatus.DONE,
            itemCap: items.length + input.failedCount,
            captureAdapter: input.captureAdapter,
            llmAdapter: input.llmAdapter,
            itemsCaptured: items.length + input.failedCount,
            itemsCreated: fresh.length,
            itemsUpdated: repeat.length,
            itemsFailed: input.failedCount,
            startedAt: input.startedAt,
            finishedAt: capturedAt,
          },
        });

        return upsertItems(tx, { runId, sourceId, capturedAt, known, fresh, repeat });
      },
      { timeout: TRANSACTION_TIMEOUT_MS }
    );
  }

  async saveCapturePage(input: SaveCapturePageInput): Promise<SaveCaptureResult> {
    const { runId, sourceId, items } = input;
    const capturedAt = new Date();

    return this.prisma.$transaction(
      async (tx) => {
        const { known, fresh, repeat } = await lockAndSplit(tx, sourceId, items);
        const result = await upsertItems(tx, { runId, sourceId, capturedAt, known, fresh, repeat });
        await tx.radarRun.update({
          where: { id: runId },
          data: {
            itemsCaptured: { increment: items.length + input.failedCount },
            itemsCreated: { increment: result.created },
            itemsUpdated: { increment: result.updated },
            itemsFailed: { increment: input.failedCount },
          },
        });
        return result;
      },
      { timeout: TRANSACTION_TIMEOUT_MS }
    );
  }
}

type KnownItem = { externalId: string; media: Prisma.JsonValue; sharedPost: Prisma.JsonValue };

async function lockAndSplit(tx: Tx, sourceId: string, items: NormalizedRadarItem[]) {
  const externalIds = items.map((i) => i.externalId);
  // Row locks serialize with image persistence (RadarImageRepository.applyResults), so a
  // re-capture never reads media that an in-flight image upload is about to change.
  await tx.$queryRaw`SELECT id FROM radar_items WHERE "sourceId" = ${sourceId}::uuid AND "externalId" = ANY(${externalIds}) FOR UPDATE`;
  const existing = await tx.radarItem.findMany({
    where: { sourceId, externalId: { in: externalIds } },
    select: { externalId: true, media: true, sharedPost: true },
  });
  const known = new Map<string, KnownItem>(existing.map((e) => [e.externalId, e]));
  return {
    known,
    fresh: items.filter((i) => !known.has(i.externalId)),
    repeat: items.filter((i) => known.has(i.externalId)),
  };
}

async function upsertItems(
  tx: Tx,
  args: {
    runId: string;
    sourceId: string;
    capturedAt: Date;
    known: Map<string, KnownItem>;
    fresh: NormalizedRadarItem[];
    repeat: NormalizedRadarItem[];
  }
): Promise<SaveCaptureResult> {
  const { runId, sourceId, capturedAt, known, fresh, repeat } = args;

  if (fresh.length > 0) {
    await tx.radarItem.createMany({
      data: fresh.map((item) => ({
        id: uuidv7(),
        sourceId,
        externalId: item.externalId,
        provider: item.provider,
        ...contentOf(item, runId, capturedAt),
      })),
    });
  }

  const orphanedImageIds: string[] = [];
  for (const item of repeat) {
    const previous = known.get(item.externalId);
    const media = carryOverStoredMedia(previous?.media, item.media);
    const sharedPost = carryOverSharedPostMedia(previous?.sharedPost, item.sharedPost);
    orphanedImageIds.push(...media.orphaned, ...sharedPost.orphaned);
    const merged: NormalizedRadarItem = { ...item, media: media.value, sharedPost: sharedPost.value };
    await tx.radarItem.update({
      where: { sourceId_externalId: { sourceId, externalId: item.externalId } },
      data: contentOf(merged, runId, capturedAt),
    });
  }

  return { created: fresh.length, updated: repeat.length, orphanedImageIds };
}
