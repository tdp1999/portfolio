import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { UserProfile } from '@portfolio/console/shared/util';
import { ConsoleMainLayoutComponent } from './main-layout';
import { ComponentRef } from '@angular/core';

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
  let componentRef: ComponentRef<ConsoleMainLayoutComponent>;

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
    await TestBed.configureTestingModule({
      imports: [ConsoleMainLayoutComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsoleMainLayoutComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('resolvedTheme', 'light');
  });

  describe('admin badge', () => {
    it('should display admin badge when user has ADMIN role', () => {
      componentRef.setInput('user', adminUser);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15');
      expect(badge).toBeTruthy();
      expect(badge.textContent.trim()).toBe('Admin');
    });

    it('should not display admin badge when user has USER role', () => {
      componentRef.setInput('user', regularUser);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15');
      expect(badge).toBeNull();
    });

    it('should not display admin badge when user is null', () => {
      componentRef.setInput('user', null);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15');
      expect(badge).toBeNull();
    });

    it('should reactively show badge when user role changes to ADMIN', () => {
      componentRef.setInput('user', regularUser);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15')).toBeNull();

      componentRef.setInput('user', adminUser);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ui-sidebar-footer .bg-primary\\/15')).toBeTruthy();
    });
  });
});
