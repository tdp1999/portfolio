import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { ScrollspyRailComponent } from './scrollspy-rail.component';
import { SectionDescriptor, SectionStatus } from './scrollspy-rail.types';

// ---------------------------------------------------------------------------
// IntersectionObserver mock (jsdom doesn't provide it)
// ---------------------------------------------------------------------------

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
const mockUnobserve = jest.fn();

(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = jest.fn(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  unobserve: mockUnobserve,
}));

// ---------------------------------------------------------------------------
// Test host (provides sections input)
// ---------------------------------------------------------------------------

function makeSection(id: string, label: string, status: SectionStatus = 'untouched'): SectionDescriptor {
  return { id, label, status: signal(status) };
}

@Component({
  standalone: true,
  imports: [ScrollspyRailComponent],
  template: `<console-scrollspy-rail [sections]="sections" />`,
})
class TestHostComponent {
  sections: SectionDescriptor[] = [
    makeSection('identity', 'Identity', 'untouched'),
    makeSection('work', 'Work', 'editing'),
    makeSection('skills', 'Skills', 'saved'),
    makeSection('contact', 'Contact', 'error'),
  ];
}

describe('ScrollspyRailComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let nativeEl: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    nativeEl = fixture.nativeElement;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should render all section items', () => {
    const items = nativeEl.querySelectorAll('.scrollspy-rail__item');
    expect(items.length).toBe(4);
  });

  describe('status icon mapping', () => {
    it('should show ○ for untouched', () => {
      const icons = nativeEl.querySelectorAll('.scrollspy-rail__icon');
      expect(icons[0].textContent?.trim()).toBe('○');
    });

    it('should show ● for editing', () => {
      const icons = nativeEl.querySelectorAll('.scrollspy-rail__icon');
      expect(icons[1].textContent?.trim()).toBe('●');
    });

    it('should show ✓ for saved', () => {
      const icons = nativeEl.querySelectorAll('.scrollspy-rail__icon');
      expect(icons[2].textContent?.trim()).toBe('✓');
    });

    it('should show ⚠ for error', () => {
      const icons = nativeEl.querySelectorAll('.scrollspy-rail__icon');
      expect(icons[3].textContent?.trim()).toBe('⚠');
    });
  });

  describe('status icon CSS classes', () => {
    it('should apply --editing class for editing status', () => {
      const icons = nativeEl.querySelectorAll('.scrollspy-rail__icon');
      expect(icons[1].classList.contains('scrollspy-rail__icon--editing')).toBe(true);
    });

    it('should apply --saved class for saved status', () => {
      const icons = nativeEl.querySelectorAll('.scrollspy-rail__icon');
      expect(icons[2].classList.contains('scrollspy-rail__icon--saved')).toBe(true);
    });

    it('should apply --error class for error status', () => {
      const icons = nativeEl.querySelectorAll('.scrollspy-rail__icon');
      expect(icons[3].classList.contains('scrollspy-rail__icon--error')).toBe(true);
    });
  });

  describe('aria-current', () => {
    it('should not set aria-current when no item is active', () => {
      const items = nativeEl.querySelectorAll('.scrollspy-rail__item');
      items.forEach((item) => {
        expect(item.getAttribute('aria-current')).toBeNull();
      });
    });

    it('should set aria-current="true" on the active item', () => {
      const railComponent = fixture.debugElement.children[0].componentInstance as ScrollspyRailComponent;
      railComponent.activeId.set('work');
      fixture.detectChanges();

      const items = nativeEl.querySelectorAll('.scrollspy-rail__item');
      expect(items[1].getAttribute('aria-current')).toBe('true');
      expect(items[0].getAttribute('aria-current')).toBeNull();
    });
  });

  describe('click navigation', () => {
    it('should call router.navigate with fragment on click', () => {
      const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      // Create a target element so scrollIntoView doesn't fail
      const target = document.createElement('div');
      target.id = 'work';
      target.scrollIntoView = jest.fn();
      document.body.appendChild(target);

      const items = nativeEl.querySelectorAll<HTMLButtonElement>('.scrollspy-rail__item');
      items[1].click();

      expect(navigateSpy).toHaveBeenCalledWith([], expect.objectContaining({ fragment: 'work' }));

      document.body.removeChild(target);
    });
  });

  describe('labels', () => {
    it('should render section labels', () => {
      const labels = nativeEl.querySelectorAll('.scrollspy-rail__label');
      expect(labels[0].textContent?.trim()).toBe('Identity');
      expect(labels[1].textContent?.trim()).toBe('Work');
      expect(labels[2].textContent?.trim()).toBe('Skills');
      expect(labels[3].textContent?.trim()).toBe('Contact');
    });
  });
});
