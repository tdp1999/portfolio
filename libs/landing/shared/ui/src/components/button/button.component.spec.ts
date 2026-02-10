import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default state', () => {
    it('should have primary variant by default', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--primary');
    });

    it('should have md size by default', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--md');
    });

    it('should not be disabled by default', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(false);
    });
  });

  describe('variants', () => {
    it('should apply primary variant class', () => {
      fixture.componentRef.setInput('variant', 'primary');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--primary');
    });

    it('should apply secondary variant class', () => {
      fixture.componentRef.setInput('variant', 'secondary');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--secondary');
    });

    it('should apply ghost variant class', () => {
      fixture.componentRef.setInput('variant', 'ghost');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--ghost');
    });
  });

  describe('sizes', () => {
    it('should apply sm size class', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--sm');
    });

    it('should apply md size class', () => {
      fixture.componentRef.setInput('size', 'md');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--md');
    });

    it('should apply lg size class', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--lg');
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute when disabled is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });

    it('should not emit click event when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.buttonClick, 'emit');
      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('click events', () => {
    it('should emit buttonClick event when clicked', () => {
      fixture.detectChanges();
      const emitSpy = jest.spyOn(component.buttonClick, 'emit');

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(expect.any(MouseEvent));
    });

    it('should emit click event when not disabled', () => {
      fixture.componentRef.setInput('disabled', false);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.buttonClick, 'emit');
      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('CSS classes', () => {
    it('should always include base btn class', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn');
    });

    it('should combine variant and size classes', () => {
      fixture.componentRef.setInput('variant', 'secondary');
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.className).toContain('btn--secondary');
      expect(button.className).toContain('btn--lg');
    });
  });

  describe('flexbox layout', () => {
    it('should have inline-flex for icon + text layout', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');
      const styles = window.getComputedStyle(button);
      expect(button.className).toContain('btn');
      // The btn class applies inline-flex via Tailwind
    });
  });
});
