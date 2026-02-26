import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { AuthStore } from '../auth.store';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  let authStore: {
    isAuthenticated: ReturnType<typeof signal>;
    isBootstrapping: ReturnType<typeof signal>;
  };
  let router: Router;

  beforeEach(() => {
    authStore = {
      isAuthenticated: signal(false),
      isBootstrapping: signal(false),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: authStore },
        {
          provide: Router,
          useValue: {
            createUrlTree: jest.fn(() => ({ toString: () => '/' }) as UrlTree),
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  function runGuard(): unknown {
    return TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
  }

  it('should allow access when not authenticated', () => {
    authStore.isAuthenticated.set(false);

    expect(runGuard()).toBe(true);
  });

  it('should redirect to home when authenticated', () => {
    authStore.isAuthenticated.set(true);

    const result = runGuard();

    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).not.toBe(true);
  });

  it('should wait for bootstrap then allow guest access', (done) => {
    authStore.isBootstrapping.set(true);
    authStore.isAuthenticated.set(false);

    const result = runGuard();

    (result as Observable<boolean | UrlTree>).subscribe((value) => {
      expect(value).toBe(true);
      done();
    });

    authStore.isBootstrapping.set(false);
  });

  it('should wait for bootstrap then redirect if authenticated', (done) => {
    authStore.isBootstrapping.set(true);
    authStore.isAuthenticated.set(true);

    const result = runGuard();

    (result as Observable<boolean | UrlTree>).subscribe((value) => {
      expect(value).not.toBe(true);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
      done();
    });

    authStore.isBootstrapping.set(false);
  });
});
