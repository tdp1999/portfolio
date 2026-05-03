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
    it('uses solid variant and md size by default', () => {
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.className).toContain('landing-btn--solid');
      expect(button.className).toContain('landing-btn--md');
      expect(button.disabled).toBe(false);
      expect(button.type).toBe('button');
    });
  });

  describe('variants', () => {
    it.each(['solid', 'ghost', 'link'] as const)('applies %s variant class', (variant) => {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.className).toContain(`landing-btn--${variant}`);
    });
  });

  describe('sizes', () => {
    it.each(['sm', 'md'] as const)('applies %s size class', (size) => {
      fixture.componentRef.setInput('size', size);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.className).toContain(`landing-btn--${size}`);
    });
  });

  describe('disabled state', () => {
    it('applies disabled attribute', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('does not emit click when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.buttonClick, 'emit');
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      button.click();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('click events', () => {
    it('emits buttonClick when clicked and enabled', () => {
      fixture.detectChanges();
      const emitSpy = jest.spyOn(component.buttonClick, 'emit');

      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      button.click();

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(expect.any(MouseEvent));
    });
  });
});
