import { GetDashboardStatsHandler } from './get-dashboard-stats.query';
import { IDashboardRepository } from '../ports/dashboard.repository.port';

describe('GetDashboardStatsHandler', () => {
  it('returns the stats produced by the repository', async () => {
    const stats = { totalPosts: 24, mediaFiles: 156, published: 18, drafts: 6 };
    const repo: IDashboardRepository = { getStats: jest.fn().mockResolvedValue(stats) };
    const handler = new GetDashboardStatsHandler(repo);

    const result = await handler.execute();

    expect(repo.getStats).toHaveBeenCalledTimes(1);
    expect(result).toBe(stats);
  });
});
