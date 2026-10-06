import { RadarWorkStatus } from '@prisma/client';

import { RadarBrief } from '../../domain/entities/radar-brief.entity';
import { IRadarBriefRepository } from '../ports/radar-brief.repository.port';
import { SubmitBriefCommand, SubmitBriefHandler } from './brief.submit.command';

const BRIEF_ID = '01a10b5b-9d90-753e-a6a3-000000000001';
const ITEM_ID = '01a10b5b-9d90-753e-a6a3-0000000000a1';
const dto = { body: `Tin [post](/radar/items/${ITEM_ID}).`, producer: { adapter: 'claude-code', model: 'm' } };

const claimed = RadarBrief.load({
  id: BRIEF_ID,
  sourceId: null,
  windowFrom: new Date('2026-09-01T00:00:00Z'),
  windowTo: new Date('2026-09-30T23:59:59.999Z'),
  body: '',
  itemIds: [],
  workStatus: RadarWorkStatus.CLAIMED,
  leaseExpiresAt: new Date(),
  producer: null,
  createdAt: new Date(),
});

const setup = (found: RadarBrief | null, saved = true) => {
  const briefs = {
    findById: jest.fn(async () => found),
    windowItemIds: jest.fn(async () => [ITEM_ID]),
    saveResult: jest.fn(async () => saved),
  } as unknown as jest.Mocked<IRadarBriefRepository>;
  return new SubmitBriefHandler(briefs);
};

describe('SubmitBriefHandler', () => {
  it('should answer 404 for an unknown brief', async () => {
    await expect(setup(null).execute(new SubmitBriefCommand(BRIEF_ID, dto))).rejects.toMatchObject({
      errorCode: 'RADAR_BRIEF_NOT_FOUND',
    });
  });

  it('should refuse the result when the brief stopped being claimed before the write', async () => {
    await expect(setup(claimed, false).execute(new SubmitBriefCommand(BRIEF_ID, dto))).rejects.toMatchObject({
      errorCode: 'RADAR_BRIEF_NOT_CLAIMED',
    });
  });
});
