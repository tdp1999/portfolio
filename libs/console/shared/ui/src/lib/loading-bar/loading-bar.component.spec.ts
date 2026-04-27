import { TestBed } from '@angular/core/testing';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { LoadingBarComponent } from './loading-bar.component';
import { ProgressBarService } from './progress-bar.service';

describe('LoadingBarComponent', () => {
  let component: LoadingBarComponent;
  let progress: ProgressBarService;
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
    progress = TestBed.inject(ProgressBarService);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
    progress.reset();
  });

  it('should not be visible initially', () => {
    expect(component.visible()).toBe(false);
  });

  it('should show on NavigationStart', () => {
    routerEvents$.next(new NavigationStart(1, '/test'));
    TestBed.flushEffects();
    expect(component.visible()).toBe(true);
  });

  it('should hide after NavigationEnd respecting minimum display time', () => {
    routerEvents$.next(new NavigationStart(1, '/test'));
    TestBed.flushEffects();
    routerEvents$.next(new NavigationEnd(1, '/test', '/test'));
    TestBed.flushEffects();

    expect(component.visible()).toBe(true);
    jest.advanceTimersByTime(1000);
    expect(component.visible()).toBe(false);
  });

  it('should stay visible while a manual handle is active alongside router events', () => {
    routerEvents$.next(new NavigationStart(1, '/test'));
    TestBed.flushEffects();
    const handle = progress.start();
    routerEvents$.next(new NavigationEnd(1, '/test', '/test'));
    TestBed.flushEffects();
    jest.advanceTimersByTime(1000);
    expect(component.visible()).toBe(true);
    handle.complete();
    TestBed.flushEffects();
    jest.advanceTimersByTime(1000);
    expect(component.visible()).toBe(false);
  });
});
