import { Test } from '@nestjs/testing';
import { VersionController } from './version.controller';

describe('VersionController', () => {
  let controller: VersionController;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [VersionController],
    }).compile();

    controller = module.get(VersionController);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('GET /version', () => {
    it('falls back to local/development when RAILWAY_* env vars are unset', () => {
      delete process.env['RAILWAY_GIT_COMMIT_SHA'];
      delete process.env['RAILWAY_GIT_BRANCH'];
      delete process.env['RAILWAY_ENVIRONMENT_NAME'];
      delete process.env['RAILWAY_DEPLOYMENT_ID'];

      const result = controller.get();

      expect(result).toEqual({
        commitSha: 'local',
        commitShaShort: 'local',
        branch: 'local',
        environment: 'development',
        deploymentId: null,
        serverStartedAt: expect.any(String),
      });
    });

    it('passes through RAILWAY_* env vars when set', () => {
      process.env['RAILWAY_GIT_COMMIT_SHA'] = 'abcdef1234567890';
      process.env['RAILWAY_GIT_BRANCH'] = 'master';
      process.env['RAILWAY_ENVIRONMENT_NAME'] = 'production';
      process.env['RAILWAY_DEPLOYMENT_ID'] = 'deploy-123';

      const result = controller.get();

      expect(result).toEqual({
        commitSha: 'abcdef1234567890',
        commitShaShort: 'abcdef1',
        branch: 'master',
        environment: 'production',
        deploymentId: 'deploy-123',
        serverStartedAt: expect.any(String),
      });
    });
  });
});
