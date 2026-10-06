import { RadarPlatform } from '@prisma/client';

import { RadarSource } from './radar-source.entity';

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const payload = { platform: RadarPlatform.FACEBOOK, url: 'https://facebook.com/page', displayName: 'Page' };

describe('RadarSource', () => {
  it('should create an active source with a v7 id', () => {
    const source = RadarSource.create(payload);

    expect(source.id).toMatch(UUID_V7);
    expect(source.isActive).toBe(true);
  });

  it('should refuse captures only while inactive', () => {
    const source = RadarSource.create(payload);

    expect(() => source.ensureCanCapture()).not.toThrow();
    expect(() => source.setActive(false).ensureCanCapture()).toThrow(
      expect.objectContaining({ errorCode: 'RADAR_SOURCE_INACTIVE' })
    );
  });
});
