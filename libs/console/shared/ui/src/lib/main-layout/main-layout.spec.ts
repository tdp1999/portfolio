import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { API_CONFIG, AuthStore, UserProfile } from '@portfolio/console/shared/data-access';
import { ConsoleMainLayoutComponent } from './main-layout';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('ConsoleMainLayoutComponent', () => {
  let fixture: ComponentFixture<ConsoleMainLayoutComponent>;
  let userSignal: ReturnType<typeof signal<UserProfile | null>>;

  const adminUser: UserProfile = {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    hasPassword: true,
    hasGoogleLinked: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const regularUser: UserProfile = {
    id: 'user-2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'USER',
    hasPassword: true,
    hasGoogleLinked: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    userSignal = signal<UserProfile | null>(null);

    await TestBed.configureTestingModule({
      imports: [ConsoleMainLayoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: API_CONFIG, useValue: { baseUrl: '', timeout: 0 } },
        {
          provide: AuthStore,
          useValue: {
            user: userSignal,
            logout: () => ({ subscribe: /* noop */ () => undefined }),
            logoutAll: () => ({ subscribe: /* noop */ () => undefined }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsoleMainLayoutComponent);
  });

  describe('admin badge', () => {
    it('should display admin badge when user has ADMIN role', () => {
      userSignal.set(adminUser);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15');
      expect(badge).toBeTruthy();
      expect(badge.textContent.trim()).toBe('Admin');
    });

    it('should not display admin badge when user has USER role', () => {
      userSignal.set(regularUser);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15');
      expect(badge).toBeNull();
    });

    it('should not display admin badge when user is null', () => {
      userSignal.set(null);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15');
      expect(badge).toBeNull();
    });

    it('should reactively show badge when user role changes to ADMIN', () => {
      userSignal.set(regularUser);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15')).toBeNull();

      userSignal.set(adminUser);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15')).toBeTruthy();
    });
  });
});
