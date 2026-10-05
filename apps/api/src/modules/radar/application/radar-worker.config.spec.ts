import { loadRadarWorkerConfig } from './radar-worker.config';

const HASH = 'a'.repeat(64);

describe('loadRadarWorkerConfig', () => {
  it('should decode a sha-256 hex hash, ignoring surrounding whitespace', () => {
    expect(loadRadarWorkerConfig(`  ${HASH}\n`).tokenHash).toEqual(Buffer.from(HASH, 'hex'));
  });

  it('should switch the worker routes off when the hash is unset', () => {
    expect(loadRadarWorkerConfig(undefined).tokenHash).toBeNull();
  });

  it('should switch the worker routes off when the value is not a sha-256 hex', () => {
    expect(loadRadarWorkerConfig('my-plain-token').tokenHash).toBeNull();
  });
});
