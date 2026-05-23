export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  hasPassword: boolean;
  hasGoogleLinked: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  hasAcceptedInvite: boolean;
}

export interface UsersListResponse {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
}
