import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';
import { AdminUserService, AdminUser, UsersListResponse } from '../admin-user.service';
import UsersPageComponent from './users-page';

const mockUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: 'user-1',
  email: 'test@test.com',
  name: 'Test User',
  role: 'USER',
  hasPassword: true,
  hasGoogleLinked: false,
  hasAcceptedInvite: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
  ...overrides,
});

describe('UsersPageComponent', () => {
  let component: UsersPageComponent;
  let fixture: ComponentFixture<UsersPageComponent>;
  let adminUserService: { list: jest.Mock; invite: jest.Mock; softDelete: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };
  let dialog: { open: jest.Mock };

  const listResponse: UsersListResponse = {
    data: [mockUser()],
    total: 1,
    page: 1,
    limit: 20,
  };

  beforeEach(async () => {
    adminUserService = {
      list: jest.fn().mockReturnValue(of(listResponse)),
      invite: jest.fn(),
      softDelete: jest.fn(),
    };
    toast = { success: jest.fn(), error: jest.fn() };
    dialog = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AdminUserService, useValue: adminUserService },
        { provide: AuthStore, useValue: { user: signal({ id: 'admin-1', role: 'ADMIN' }) } },
        { provide: ToastService, useValue: toast },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(adminUserService.list).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
    });
    expect(component.users()).toEqual(listResponse.data);
    expect(component.total()).toBe(1);
  });

  it('should show error toast on load failure', () => {
    adminUserService.list.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(toast.error).toHaveBeenCalledWith('Failed to load users');
  });

  it('should update search and reload users', () => {
    adminUserService.list.mockClear();
    component.onSearchChange('test');
    expect(component.search()).toBe('test');
    expect(adminUserService.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'test', page: 1 }));
  });

  it('should update status filter and reload users', () => {
    adminUserService.list.mockClear();
    component.onStatusChange('active');
    expect(component.statusFilter()).toBe('active');
    expect(adminUserService.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', page: 1 }));
  });

  it('should handle pagination', () => {
    adminUserService.list.mockClear();
    component.onPage({ pageIndex: 2, pageSize: 50, length: 100, previousPageIndex: 0 });
    expect(component.pageIndex()).toBe(2);
    expect(component.pageSize()).toBe(50);
    expect(adminUserService.list).toHaveBeenCalledWith({
      page: 3,
      limit: 50,
      search: undefined,
      status: undefined,
    });
  });

  describe('canDelete', () => {
    it('should return true for other active users', () => {
      expect(component.canDelete(mockUser({ id: 'other-user' }))).toBe(true);
    });

    it('should return false for self', () => {
      expect(component.canDelete(mockUser({ id: 'admin-1' }))).toBe(false);
    });

    it('should return false for already deleted users', () => {
      expect(component.canDelete(mockUser({ id: 'other', deletedAt: '2024-01-01' }))).toBe(false);
    });
  });

  describe('isDeleted', () => {
    it('should return true when deletedAt is set', () => {
      expect(component.isDeleted(mockUser({ deletedAt: '2024-01-01' }))).toBe(true);
    });

    it('should return false when deletedAt is null', () => {
      expect(component.isDeleted(mockUser())).toBe(false);
    });
  });
});
