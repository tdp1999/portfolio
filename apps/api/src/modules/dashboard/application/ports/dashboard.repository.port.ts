import { DashboardStatsDto } from '../dashboard.dto';

export interface IDashboardRepository {
  getStats(): Promise<DashboardStatsDto>;
}
