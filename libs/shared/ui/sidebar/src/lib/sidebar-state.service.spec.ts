import { TestBed } from '@angular/core/testing';
import {
  BreakpointObserverService,
  BreakpointState,
} from '@portfolio/shared/features/breakpoint-observer';
import { signal, WritableSignal } from '@angular/core';

import { SidebarState } from './sidebar-state.service';

describe('SidebarState', () => {
  let service: SidebarState;
  let breakpointSignal: WritableSignal<BreakpointState>;

  beforeEach(() => {
    breakpointSignal = signal<BreakpointState>({ name: 'desktop', mediaQuery: '', isActive: true });

    TestBed.configureTestingModule({
      providers: [
        SidebarState,
        {
          provide: BreakpointObserverService,
          useValue: { observe: () => breakpointSignal.asReadonly() },
        },
      ],
    });

    service = TestBed.inject(SidebarState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to open and expanded', () => {
    expect(service.isOpen()).toBe(true);
    expect(service.variant()).toBe('expanded');
    expect(service.isCompact()).toBe(false);
  });

  it('should toggle open state', () => {
    service.toggle();
    expect(service.isOpen()).toBe(false);

    service.toggle();
    expect(service.isOpen()).toBe(true);
  });

  it('should set variant', () => {
    service.setVariant('icon');
    expect(service.variant()).toBe('icon');
    expect(service.isCompact()).toBe(true);
  });

  it('should set open state directly', () => {
    service.setOpen(false);
    expect(service.isOpen()).toBe(false);

    service.setOpen(true);
    expect(service.isOpen()).toBe(true);
  });

  it('should detect mobile from breakpoint observer', () => {
    expect(service.isMobile()).toBe(false);

    breakpointSignal.set({ name: 'mobile', mediaQuery: '', isActive: true });
    TestBed.flushEffects();

    expect(service.isMobile()).toBe(true);
  });

  it('should auto-close when switching to mobile', () => {
    expect(service.isOpen()).toBe(true);

    breakpointSignal.set({ name: 'mobile', mediaQuery: '', isActive: true });
    TestBed.flushEffects();

    expect(service.isOpen()).toBe(false);
  });

  it('should not auto-close on non-mobile breakpoints', () => {
    service.setOpen(true);

    breakpointSignal.set({ name: 'tablet', mediaQuery: '', isActive: true });
    TestBed.flushEffects();

    expect(service.isOpen()).toBe(true);
  });
});
