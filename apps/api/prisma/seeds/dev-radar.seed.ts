/**
 * DEV-ONLY Radar seed — adds sample enrichments to locally captured Radar items so the console
 * Feed and Detail pages show both analyzed and pending posts.
 *
 * Items are not created here: upload the fixture first through Console → Radar → Sources and
 * upload (`apps/api/src/modules/radar/infrastructure/capture/__fixtures__/apify-posts.sample.json`),
 * which also exercises the real upload path. Then run:
 *   pnpm tsx --tsconfig apps/api/tsconfig.json apps/api/prisma/seeds/dev-radar.seed.ts
 *
 * Matches items by `externalId` (the Facebook post id), so it works on any database holding the
 * fixture. Idempotent: enrichments are upserted. Posts absent from `dev-radar.data.json` stay
 * pending on purpose.
 */
import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

interface SampleEnrichment {
  tldr: string;
  providerTags: string[];
  contentType: string;
  signalScore: number;
  isPromo: boolean;
  isRelevant: boolean;
  imageNotes: string | null;
  linkSummaries: { url: string; summary: string }[];
  commentDigest: string | null;
  factCheck: string | null;
  applyNote: string | null;
}

const SAMPLES: Record<string, SampleEnrichment> = JSON.parse(
  readFileSync(resolve(__dirname, 'dev-radar.data.json'), 'utf8')
);

/** Refuses anything but a local database: on prod this would overwrite real enrichments with sample ones. */
function assertLocalDatabase(url: string | undefined): string {
  const host = url ? new URL(url).hostname : '';
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error(`dev-radar seed only runs against a local database (DATABASE_URL host is "${host || 'unset'}").`);
  }
  return url as string;
}

async function main(): Promise<void> {
  const connectionString = assertLocalDatabase(process.env['DATABASE_URL']);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const items = await prisma.radarItem.findMany({
      where: { externalId: { in: Object.keys(SAMPLES) } },
      select: { id: true, externalId: true },
    });
    if (items.length === 0) {
      console.log('No fixture items found. Upload the fixture in Console → Radar first.');
      return;
    }

    for (const item of items) {
      const data = { ...SAMPLES[item.externalId], producerAdapter: 'dev-seed', producerModel: 'hand-written' };
      await prisma.radarEnrichment.upsert({
        where: { itemId: item.id },
        create: { id: uuidv7(), itemId: item.id, ...data },
        update: data,
      });
      await prisma.radarItem.update({ where: { id: item.id }, data: { workStatus: 'DONE', leaseExpiresAt: null } });
    }
    console.log(`Enriched ${items.length} radar item(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
