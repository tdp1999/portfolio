import { inject, Injectable } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';

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

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly api = inject(ApiService);

  list(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.status) queryParams['status'] = params.status;
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.sortDir) queryParams['sortDir'] = params.sortDir;
    return this.api.get<UsersListResponse>('/users', { params: queryParams });
  }

  invite(data: { name: string; email: string }) {
    return this.api.post('/users', data);
  }

  softDelete(id: string) {
    return this.api.delete<{ success: boolean }>(`/users/${id}`);
  }
}
