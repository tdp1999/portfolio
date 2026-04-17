import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '../auth.store';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let authStore: { user: jest.Mock };
  let router: { createUrlTree: jest.Mock };

  beforeEach(() => {
    authStore = { user: jest.fn() };
    router = { createUrlTree: jest.fn().mockReturnValue('home-url-tree') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
      ],
    });
  });

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      adminGuard({} as Parameters<typeof adminGuard>[0], {} as Parameters<typeof adminGuard>[1])
    );

  it('should allow access for admin users', () => {
    authStore.user.mockReturnValue({ role: 'ADMIN' });
    expect(runGuard()).toBe(true);
  });

  it('should redirect non-admin users to home', () => {
    authStore.user.mockReturnValue({ role: 'USER' });
    expect(runGuard()).toBe('home-url-tree');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should redirect when user is null', () => {
    authStore.user.mockReturnValue(null);
    expect(runGuard()).toBe('home-url-tree');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
