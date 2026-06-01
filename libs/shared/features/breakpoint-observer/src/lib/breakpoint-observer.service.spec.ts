import { BreakpointObserver, BreakpointState as CdkBreakpointState } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { BreakpointObserverService } from './breakpoint-observer.service';
import { DEFAULT_BREAKPOINTS } from './breakpoint.constant';
import { BreakpointConfig } from './breakpoint.type';
import { RESPONSIVE_BREAKPOINTS } from './responsive-breakpoint.constant';

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
    // The service eagerly observes RESPONSIVE_BREAKPOINTS at construction (for
    // the 4-BP API). Clear that call so per-test cdk.observe counts start at 0.
    observeSpy.mockClear();
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

  describe('4-BP responsive API', () => {
    // `currentBp` subscribes lazily on first read — prime it so emits are caught.
    beforeEach(() => {
      service.currentBp();
    });

    function emitResponsive(active: 'mobile' | 'tablet' | 'laptop' | 'wide'): void {
      emitBreakpoint({
        [RESPONSIVE_BREAKPOINTS['mobile']]: active === 'mobile',
        [RESPONSIVE_BREAKPOINTS['tablet']]: active === 'tablet',
        [RESPONSIVE_BREAKPOINTS['laptop']]: active === 'laptop',
        [RESPONSIVE_BREAKPOINTS['wide']]: active === 'wide',
      });
    }

    it('defaults currentBp to "wide" before any emit (SSR fallback)', () => {
      expect(service.currentBp()).toBe('wide');
      expect(service.isWide()).toBe(true);
    });

    it('tracks currentBp and flags across breakpoints', () => {
      emitResponsive('mobile');
      expect(service.currentBp()).toBe('mobile');
      expect(service.isMobile()).toBe(true);
      expect(service.isWide()).toBe(false);

      emitResponsive('laptop');
      expect(service.currentBp()).toBe('laptop');
      expect(service.isLaptop()).toBe(true);
      expect(service.isMobile()).toBe(false);
    });

    it('isAtLeast is true for the named BP and wider', () => {
      emitResponsive('laptop');
      expect(service.isAtLeast('mobile')).toBe(true);
      expect(service.isAtLeast('tablet')).toBe(true);
      expect(service.isAtLeast('laptop')).toBe(true);
      expect(service.isAtLeast('wide')).toBe(false);
    });
  });
});
