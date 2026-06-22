/**
 * Aggregate counts powering the console dashboard stat cards.
 * All counts exclude soft-deleted records (`deletedAt: null`).
 */
export interface DashboardStatsDto {
  totalPosts: number;
  mediaFiles: number;
  published: number;
  drafts: number;
}
