import { TestBed } from '@angular/core/testing';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { LoadingBarComponent } from './loading-bar.component';

describe('LoadingBarComponent', () => {
  let component: LoadingBarComponent;
  let routerEvents$: Subject<unknown>;

  beforeEach(() => {
    jest.useFakeTimers();
    routerEvents$ = new Subject();

    TestBed.configureTestingModule({
      imports: [LoadingBarComponent],
      providers: [{ provide: Router, useValue: { events: routerEvents$.asObservable() } }],
    });

    const fixture = TestBed.createComponent(LoadingBarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not be loading initially', () => {
    expect(component.loading()).toBe(false);
    expect(component.visible()).toBe(false);
  });

  it('should show loading on NavigationStart', () => {
    routerEvents$.next(new NavigationStart(1, '/test'));
    expect(component.loading()).toBe(true);
    expect(component.visible()).toBe(true);
  });

  it('should hide after NavigationEnd with minimum display time', () => {
    routerEvents$.next(new NavigationStart(1, '/test'));
    routerEvents$.next(new NavigationEnd(1, '/test', '/test'));

    // Still visible during minimum display period
    expect(component.visible()).toBe(true);

    // After min display (1000ms) + fade-out (200ms)
    jest.advanceTimersByTime(1200);
    expect(component.loading()).toBe(false);
    expect(component.visible()).toBe(false);
  });
});
