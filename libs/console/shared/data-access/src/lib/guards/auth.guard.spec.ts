import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStore } from '../auth.store';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
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
            createUrlTree: jest.fn(
              (commands: string[], extras?: { queryParams?: Record<string, string> }) => {
                return {
                  toString: () => `${commands[0]}?returnUrl=${extras?.queryParams?.['returnUrl']}`,
                } as UrlTree;
              }
            ),
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  function runGuard(url = '/dashboard'): unknown {
    return TestBed.runInInjectionContext(() => authGuard({} as never, { url } as never));
  }

  it('should allow access when authenticated and not bootstrapping', () => {
    authStore.isAuthenticated.set(true);

    expect(runGuard()).toBe(true);
  });

  it('should redirect to login with returnUrl when not authenticated', () => {
    authStore.isAuthenticated.set(false);

    const result = runGuard('/some/page');

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/some/page' },
    });
    expect(result).toBeDefined();
    expect(result).not.toBe(true);
  });

  it('should wait for bootstrap to complete before evaluating', (done) => {
    authStore.isBootstrapping.set(true);
    authStore.isAuthenticated.set(false);

    const result = runGuard('/dashboard');
    expect(result).toBeInstanceOf(Observable);

    (result as Observable<boolean | UrlTree>).subscribe((value) => {
      expect(value).not.toBe(true);
      expect(router.createUrlTree).toHaveBeenCalled();
      done();
    });

    // Simulate bootstrap completing
    authStore.isBootstrapping.set(false);
  });

  it('should allow access after bootstrap completes if authenticated', (done) => {
    authStore.isBootstrapping.set(true);
    authStore.isAuthenticated.set(true);

    const result = runGuard();

    (result as Observable<boolean | UrlTree>).subscribe((value) => {
      expect(value).toBe(true);
      done();
    });

    authStore.isBootstrapping.set(false);
  });
});
