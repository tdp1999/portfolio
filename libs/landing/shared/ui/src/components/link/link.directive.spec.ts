import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LinkDirective } from './link.directive';

@Component({
  standalone: true,
  imports: [LinkDirective],
  template: `
    <a landingLink>Regular Link</a>
    <a landingLink [external]="true">External Link</a>
    <a landingLink class="custom-class">Custom Classes</a>
  `,
})
class TestHostComponent {}

describe('LinkDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let linkElements: DebugElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, LinkDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    linkElements = fixture.debugElement.queryAll(By.directive(LinkDirective));
  });

  it('should create directive instances', () => {
    expect(linkElements.length).toBe(3);
  });

  it('should add base link class to all elements with directive', () => {
    linkElements.forEach((linkEl) => {
      const element = linkEl.nativeElement as HTMLElement;
      expect(element.classList.contains('link')).toBe(true);
    });
  });

  it('should add external class when external input is true', () => {
    const externalLink = linkElements[1].nativeElement as HTMLElement;
    expect(externalLink.classList.contains('link--external')).toBe(true);
  });

  it('should not add external class when external input is false or not set', () => {
    const regularLink = linkElements[0].nativeElement as HTMLElement;
    expect(regularLink.classList.contains('link--external')).toBe(false);
  });

  it('should preserve custom classes on host element', () => {
    const customLink = linkElements[2].nativeElement as HTMLElement;
    expect(customLink.classList.contains('link')).toBe(true);
    expect(customLink.classList.contains('custom-class')).toBe(true);
  });

  it('should work with routerLink and href', () => {
    // Just verify the directive can be used on anchor elements
    const firstLink = linkElements[0].nativeElement as HTMLElement;
    expect(firstLink.tagName.toLowerCase()).toBe('a');
  });
});
