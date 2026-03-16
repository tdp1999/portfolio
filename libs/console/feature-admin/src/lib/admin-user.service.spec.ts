import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@portfolio/console/shared/data-access';
import { AdminUserService, UsersListResponse } from './admin-user.service';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let api: { get: jest.Mock; post: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    api = { get: jest.fn(), post: jest.fn(), delete: jest.fn() };

    TestBed.configureTestingModule({
      providers: [AdminUserService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(AdminUserService);
  });

  describe('list', () => {
    it('should call GET /users with pagination params', () => {
      const response: UsersListResponse = { data: [], total: 0, page: 1, limit: 20 };
      api.get.mockReturnValue(of(response));

      service.list({ page: 1, limit: 20 }).subscribe((res) => {
        expect(res).toEqual(response);
      });

      expect(api.get).toHaveBeenCalledWith('/users', {
        params: { page: '1', limit: '20' },
      });
    });

    it('should include search param when provided', () => {
      api.get.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 20 }));

      service.list({ page: 1, limit: 20, search: 'test' }).subscribe();

      expect(api.get).toHaveBeenCalledWith('/users', {
        params: { page: '1', limit: '20', search: 'test' },
      });
    });

    it('should not include search param when empty', () => {
      api.get.mockReturnValue(of({ data: [], total: 0, page: 1, limit: 20 }));

      service.list({ page: 2, limit: 50 }).subscribe();

      expect(api.get).toHaveBeenCalledWith('/users', {
        params: { page: '2', limit: '50' },
      });
    });
  });

  describe('invite', () => {
    it('should call POST /users with name and email', () => {
      api.post.mockReturnValue(of({}));

      service.invite({ name: 'John', email: 'john@test.com' }).subscribe();

      expect(api.post).toHaveBeenCalledWith('/users', { name: 'John', email: 'john@test.com' });
    });
  });

  describe('softDelete', () => {
    it('should call DELETE /users/:id', () => {
      api.delete.mockReturnValue(of({ success: true }));

      service.softDelete('user-1').subscribe((res) => {
        expect(res).toEqual({ success: true });
      });

      expect(api.delete).toHaveBeenCalledWith('/users/user-1');
    });
  });
});
