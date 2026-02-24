import { BreakpointObserver, BreakpointState as CdkBreakpointState } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { BreakpointObserverService } from './breakpoint-observer.service';
import { DEFAULT_BREAKPOINTS } from './breakpoint.constant';
import { BreakpointConfig } from './breakpoint.type';

describe('BreakpointObserverService', () => {
  let service: BreakpointObserverService;
  let breakpointSubject: Subject<CdkBreakpointState>;
  let observeSpy: jest.SpyInstance;

  beforeEach(() => {
    breakpointSubject = new Subject<CdkBreakpointState>();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            observe: jest.fn().mockReturnValue(breakpointSubject.asObservable()),
          },
        },
      ],
    });

    service = TestBed.inject(BreakpointObserverService);
    observeSpy = jest.spyOn(TestBed.inject(BreakpointObserver), 'observe');
  });

  function emitBreakpoint(matches: Record<string, boolean>): void {
    breakpointSubject.next({ matches: Object.values(matches).some(Boolean), breakpoints: matches });
    TestBed.flushEffects();
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return a signal with inactive initial state', () => {
    const state = service.observe();
    expect(state()).toEqual({ name: '', mediaQuery: '', isActive: false });
  });

  it('should detect mobile breakpoint', () => {
    const state = service.observe();

    emitBreakpoint({
      [DEFAULT_BREAKPOINTS['mobile']]: true,
      [DEFAULT_BREAKPOINTS['tablet']]: false,
      [DEFAULT_BREAKPOINTS['desktop']]: false,
    });

    expect(state().name).toBe('mobile');
    expect(state().isActive).toBe(true);
  });

  it('should detect tablet breakpoint', () => {
    const state = service.observe();

    emitBreakpoint({
      [DEFAULT_BREAKPOINTS['mobile']]: false,
      [DEFAULT_BREAKPOINTS['tablet']]: true,
      [DEFAULT_BREAKPOINTS['desktop']]: false,
    });

    expect(state().name).toBe('tablet');
    expect(state().isActive).toBe(true);
  });

  it('should detect desktop breakpoint', () => {
    const state = service.observe();

    emitBreakpoint({
      [DEFAULT_BREAKPOINTS['mobile']]: false,
      [DEFAULT_BREAKPOINTS['tablet']]: false,
      [DEFAULT_BREAKPOINTS['desktop']]: true,
    });

    expect(state().name).toBe('desktop');
    expect(state().isActive).toBe(true);
  });

  it('should return cached signal for same config', () => {
    const signal1 = service.observe();
    const signal2 = service.observe();

    expect(signal1).toBe(signal2);
    expect(observeSpy).toHaveBeenCalledTimes(1);
  });

  it('should create separate observers for different configs', () => {
    const customConfig: BreakpointConfig = {
      small: '(max-width: 600px)',
      large: '(min-width: 601px)',
    };

    service.observe();
    service.observe(customConfig);

    expect(observeSpy).toHaveBeenCalledTimes(2);
  });

  it('should return first breakpoint as inactive when none match', () => {
    const state = service.observe();

    emitBreakpoint({
      [DEFAULT_BREAKPOINTS['mobile']]: false,
      [DEFAULT_BREAKPOINTS['tablet']]: false,
      [DEFAULT_BREAKPOINTS['desktop']]: false,
    });

    expect(state().name).toBe('mobile');
    expect(state().isActive).toBe(false);
  });
});
