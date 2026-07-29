import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthStore, DashboardService } from '@portfolio/console/shared/data-access';
import Home from './home';

/**
 * The role split is the whole point of this file.
 *
 * `/api/dashboard/stats` is `@Roles(['ADMIN'])`, and `error-handler.provider.ts` treats a 403 as
 * blocking — it closes every dialog and navigates to `/error/403`. So a non-admin who merely
 * *landed* on the dashboard was thrown onto a full-page "Access Denied"; the component's own error
 * callback never ran, because the global handler got there first. Four auth e2e specs sign in as a
 * non-admin and expect the dashboard, so not calling the endpoint at all is the fix.
 */
describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let dashboardService: { getStats: jest.Mock };

  async function mount(role: 'ADMIN' | 'USER'): Promise<void> {
    dashboardService = {
      getStats: jest.fn().mockReturnValue(of({ totalPosts: 7, mediaFiles: 3, published: 5, drafts: 2 })),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardService },
        { provide: AuthStore, useValue: { user: signal({ name: 'Ada Lovelace', role }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  describe('as an admin', () => {
    beforeEach(() => mount('ADMIN'));

    it('fetches the stats', () => {
      expect(dashboardService.getStats).toHaveBeenCalledTimes(1);
    });

    it('renders a tile per stat, with the fetched values', () => {
      const tiles = component.stats();
      expect(tiles).toHaveLength(4);
      expect(tiles.map((t) => t.value)).toEqual([7, 3, 5, 2]);
    });
  });

  describe('as a non-admin', () => {
    beforeEach(() => mount('USER'));

    it('never calls the admin-only endpoint', () => {
      expect(dashboardService.getStats).not.toHaveBeenCalled();
    });

    it('renders no tiles, since every one of them links into an admin area', () => {
      expect(component.stats()).toEqual([]);
    });

    it('still greets the user', () => {
      expect(component.userName()).toBe('Ada');
    });
  });
});
