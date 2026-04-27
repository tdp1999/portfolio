export interface AdminTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TagsListResponse {
  data: AdminTag[];
  total: number;
  page: number;
  limit: number;
}
