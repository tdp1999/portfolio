import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';
import { AdminUserService } from '../admin-user.service';
import { AdminUser, UsersListResponse } from '../admin-user.types';
import Users from './users';

// Contract note: row-level `canDelete`/`isDeleted` and the load-failure toast that
// earlier versions exposed as component methods no longer exist — that logic now
// lives in the template (`user.id !== currentUserId() && !user.deletedAt`) and load
// errors are surfaced by the global error interceptor. Those specs were dropped
// accordingly (task 384 test-drift cleanup).

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
  let component: Users;
  let fixture: ComponentFixture<Users>;
  let adminUserService: { list: jest.Mock; invite: jest.Mock; softDelete: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };
  let dialog: { open: jest.Mock };

  const listResponse: UsersListResponse = {
    data: [mockUser()],
    total: 1,
    page: 1,
    limit: 20,
  };

  // The default load path pipes through withListLoading → withMinDuration, which
  // floors the first emission behind a timer to prevent skeleton flicker. Advance
  // the fake clock past that floor so the data reaches the component signals.
  function flushLoad(): void {
    jest.advanceTimersByTime(1000);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    jest.useFakeTimers();
    adminUserService = {
      list: jest.fn().mockReturnValue(of(listResponse)),
      invite: jest.fn(),
      softDelete: jest.fn().mockReturnValue(of(undefined)),
    };
    toast = { success: jest.fn(), error: jest.fn() };
    dialog = { open: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        provideNoopAnimations(),
        { provide: AdminUserService, useValue: adminUserService },
        { provide: AuthStore, useValue: { user: signal({ id: 'admin-1', role: 'ADMIN' }) } },
        { provide: ToastService, useValue: toast },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init with default sort', () => {
    expect(adminUserService.list).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      sortBy: 'updatedAt',
      sortDir: 'desc',
    });

    flushLoad();
    expect(component.users()).toEqual(listResponse.data);
    expect(component.total()).toBe(1);
  });

  it('should update search, reset to the first page, and reload', () => {
    adminUserService.list.mockClear();
    component.onSearchChange('test');

    expect(component.search()).toBe('test');
    expect(component.pageIndex()).toBe(0);
    expect(adminUserService.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'test', page: 1 }));
  });

  it('should update the status filter, reset to the first page, and reload', () => {
    adminUserService.list.mockClear();
    component.onStatusChange('active');

    expect(component.statusFilter()).toBe('active');
    expect(component.pageIndex()).toBe(0);
    expect(adminUserService.list).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', page: 1 }));
  });

  it('should change sort, reset to the first page, and reload', () => {
    adminUserService.list.mockClear();
    component.onSortChange({ active: 'name', direction: 'asc' });

    expect(component.sortBy()).toBe('name');
    expect(component.sortDir()).toBe('asc');
    expect(component.pageIndex()).toBe(0);
    expect(adminUserService.list).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'name', sortDir: 'asc', page: 1 })
    );
  });

  it('should fall back to default sort when the direction is cleared', () => {
    component.onSortChange({ active: '', direction: '' });

    expect(component.sortBy()).toBe('updatedAt');
    expect(component.sortDir()).toBe('desc');
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
      sortBy: 'updatedAt',
      sortDir: 'desc',
    });
  });

  it('should expose the current user id from the auth store', () => {
    expect(component.currentUserId()).toBe('admin-1');
  });

  describe('confirmDelete', () => {
    it('should soft-delete, toast success, and refresh when confirmed', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(true) });
      adminUserService.list.mockClear();

      component.confirmDelete(mockUser({ id: 'other-user' }));

      expect(dialog.open).toHaveBeenCalled();
      expect(adminUserService.softDelete).toHaveBeenCalledWith('other-user');
      expect(toast.success).toHaveBeenCalledWith('User deleted successfully');
      expect(adminUserService.list).toHaveBeenCalled(); // silent refresh
    });

    it('should do nothing when the dialog is dismissed', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(false) });

      component.confirmDelete(mockUser({ id: 'other-user' }));

      expect(adminUserService.softDelete).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });
});
