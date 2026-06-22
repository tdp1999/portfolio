export interface DashboardStat {
  label: string;
  value: number;
  icon: string;
  link: string;
  queryParams?: Record<string, string>;
}

export interface ActivityItem {
  icon: string;
  description: string;
  timestamp: string;
}
