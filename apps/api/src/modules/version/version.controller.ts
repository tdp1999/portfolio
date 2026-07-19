import { Controller, Get } from '@nestjs/common';

const serverStartedAt = new Date().toISOString();

@Controller('version')
export class VersionController {
  @Get()
  get() {
    const commitSha = process.env['RAILWAY_GIT_COMMIT_SHA'] ?? 'local';
    return {
      commitSha,
      commitShaShort: commitSha.slice(0, 7),
      branch: process.env['RAILWAY_GIT_BRANCH'] ?? 'local',
      environment: process.env['RAILWAY_ENVIRONMENT_NAME'] ?? 'development',
      deploymentId: process.env['RAILWAY_DEPLOYMENT_ID'] ?? null,
      serverStartedAt,
    };
  }
}
