import { RadarBriefWriter, RadarWorkStatus } from '@prisma/client';

import { RadarBriefProps } from '../radar-brief.types';
import { RadarBrief } from './radar-brief.entity';

const WINDOW = {
  sourceId: null,
  windowFrom: new Date('2026-09-01T00:00:00Z'),
  windowTo: new Date('2026-09-30T23:59:59.999Z'),
  writer: RadarBriefWriter.AUTO,
};
const IN_A = '01a10b5b-9d90-753e-a6a3-0000000000a1';
const IN_B = '01a10b5b-9d90-753e-a6a3-0000000000b2';
const OUTSIDE = '01a10b5b-9d90-753e-a6a3-0000000000ff';
const PRODUCER = { adapter: 'claude-code', model: 'claude-opus-5-5' };

const brief = (over: Partial<RadarBriefProps> = {}): RadarBrief =>
  RadarBrief.load({
    ...WINDOW,
    id: '01a10b5b-9d90-753e-a6a3-000000000001',
    body: '',
    itemIds: [],
    workStatus: RadarWorkStatus.CLAIMED,
    leaseExpiresAt: new Date('2026-10-06T10:30:00Z'),
    producer: null,
    error: null,
    createdAt: new Date('2026-10-06T10:00:00Z'),
    ...over,
  });

describe('RadarBrief', () => {
  describe('create()', () => {
    it('should refuse a new brief while another one waits for the worker', () => {
      expect(() => RadarBrief.create(WINDOW, 5, true)).toThrow(
        expect.objectContaining({ errorCode: 'RADAR_BRIEF_ALREADY_WAITING' })
      );
    });

    it('should refuse a window with no analyzed post', () => {
      expect(() => RadarBrief.create(WINDOW, 0, false)).toThrow(
        expect.objectContaining({ errorCode: 'RADAR_BRIEF_EMPTY_WINDOW' })
      );
    });

    it('should create an unwritten brief waiting in the queue', () => {
      const created = RadarBrief.create(WINDOW, 5, false);

      expect(created.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
      expect(created).toMatchObject({
        workStatus: RadarWorkStatus.PENDING,
        body: '',
        itemIds: [],
        leaseExpiresAt: null,
        producer: null,
      });
    });
  });

  describe('complete()', () => {
    const linked = `Claude ra skill mới [post](/radar/items/${IN_A}).`;

    it('should refuse a brief the worker does not hold', () => {
      expect(() => brief({ workStatus: RadarWorkStatus.PENDING }).complete(linked, [IN_A], PRODUCER)).toThrow(
        expect.objectContaining({ errorCode: 'RADAR_BRIEF_NOT_CLAIMED' })
      );
    });

    it('should refuse a body that links to no post', () => {
      expect(() => brief().complete('Không có link nào.', [IN_A], PRODUCER)).toThrow(
        expect.objectContaining({ errorCode: 'RADAR_BRIEF_INVALID_LINKS' })
      );
    });

    it('should refuse a link outside the window and name it', () => {
      const body = `${linked} Và [khác](/radar/items/${OUTSIDE}).`;

      expect(() => brief().complete(body, [IN_A, IN_B], PRODUCER)).toThrow(
        expect.objectContaining({
          errorCode: 'RADAR_BRIEF_INVALID_LINKS',
          data: { outsideItemIds: [OUTSIDE] },
        })
      );
    });

    it('should accept repeated and upper-case links, then close the brief over the whole window', () => {
      const body = `${linked} Lặp lại [post](/radar/items/${IN_A.toUpperCase()}).`;

      const done = brief().complete(body, [IN_A, IN_B], PRODUCER);

      expect(done).toMatchObject({
        workStatus: RadarWorkStatus.DONE,
        leaseExpiresAt: null,
        body,
        itemIds: [IN_A, IN_B],
        producer: PRODUCER,
      });
    });
  });

  describe('fail()', () => {
    it('should end a claimed brief done, with no body and the reason, so it stops blocking a new request', () => {
      const failed = brief().fail('Every model was busy');

      expect(failed.toProps()).toMatchObject({
        workStatus: RadarWorkStatus.DONE,
        leaseExpiresAt: null,
        body: '',
        error: 'Every model was busy',
      });
    });

    it('should refuse a brief that is not claimed', () => {
      expect(() => brief({ workStatus: RadarWorkStatus.PENDING }).fail('x')).toThrow(
        expect.objectContaining({ errorCode: 'RADAR_BRIEF_NOT_CLAIMED' })
      );
    });
  });
});
