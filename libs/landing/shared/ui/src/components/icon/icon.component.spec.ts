import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';
import { IconProvider } from './icon-provider.interface';
import { ICON_PROVIDER } from './icon-provider.token';

const MOCK_SVG = '<svg width="24" height="24"><path d="M1 1" /></svg>';

class MockIconProvider implements IconProvider {
  getSvg(name: string, size: number): string | null {
    if (name === 'test') {
      return `<svg width="${size}" height="${size}"><path d="M1 1" /></svg>`;
    }
    return null;
  }

  getSupportedIcons(): string[] {
    return ['test'];
  }
}

@Component({
  standalone: true,
  imports: [IconComponent],
  template: `<landing-icon [name]="name()" [size]="size()" />`,
})
class TestHostComponent {
  readonly name = input('test');
  readonly size = input(24);
}

describe('IconComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let mockProvider: MockIconProvider;

  beforeEach(async () => {
    mockProvider = new MockIconProvider();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: ICON_PROVIDER, useValue: mockProvider }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render SVG for a valid icon name', () => {
    const span = fixture.nativeElement.querySelector('landing-icon span');

    expect(span.innerHTML).toContain('<svg');
    expect(span.innerHTML).toContain('M1 1');
  });

  it('should render empty for an unknown icon', () => {
    fixture.componentRef.setInput('name', 'unknown');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('landing-icon span');

    expect(span.innerHTML).toBe('');
  });

  it('should default size to 24', () => {
    const span = fixture.nativeElement.querySelector('landing-icon span');

    expect(span.innerHTML).toContain('width="24"');
    expect(span.innerHTML).toContain('height="24"');
  });

  it('should respect custom size', () => {
    fixture.componentRef.setInput('size', 32);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('landing-icon span');

    expect(span.innerHTML).toContain('width="32"');
    expect(span.innerHTML).toContain('height="32"');
  });

  it('should call provider with correct arguments', () => {
    const spy = jest.spyOn(mockProvider, 'getSvg');

    fixture.componentRef.setInput('name', 'test');
    fixture.componentRef.setInput('size', 16);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('test', 16);
  });

  it('should react to name changes', () => {
    const span = fixture.nativeElement.querySelector('landing-icon span');

    expect(span.innerHTML).toContain('<svg');

    fixture.componentRef.setInput('name', 'unknown');
    fixture.detectChanges();

    expect(span.innerHTML).toBe('');

    fixture.componentRef.setInput('name', 'test');
    fixture.detectChanges();

    expect(span.innerHTML).toContain('<svg');
  });

  it('should reject invalid icon names to prevent XSS attacks', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const span = fixture.nativeElement.querySelector('landing-icon span');

    // Test various XSS attempts
    const maliciousNames = [
      'test<script>alert(1)</script>',
      'test" onclick="alert(1)"',
      "test'><img src=x onerror=alert(1)>",
      'TEST', // uppercase not allowed
      'test_icon', // underscore not allowed
      'test icon', // space not allowed
    ];

    maliciousNames.forEach((maliciousName) => {
      fixture.componentRef.setInput('name', maliciousName);
      fixture.detectChanges();

      expect(span.innerHTML).toBe('');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Invalid icon name rejected: "${maliciousName}"`)
      );
    });

    consoleWarnSpy.mockRestore();
  });

  it('should allow valid icon names with hyphens and numbers', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const validNames = ['test', 'arrow-right', 'chevron-down', 'icon-123', 'test-icon-2'];

    validNames.forEach((validName) => {
      consoleWarnSpy.mockClear();
      fixture.componentRef.setInput('name', validName);
      fixture.detectChanges();

      // No warning should be logged for valid names
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    // Valid name 'test' should render successfully
    fixture.componentRef.setInput('name', 'test');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('landing-icon span');
    expect(span.innerHTML).toContain('<svg');

    consoleWarnSpy.mockRestore();
  });
});
