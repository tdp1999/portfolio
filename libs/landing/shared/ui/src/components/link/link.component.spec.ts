import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingLinkComponent } from './link.component';

describe('LandingLinkComponent', () => {
  let fixture: ComponentFixture<LandingLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingLinkComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingLinkComponent);
  });

  it('renders an anchor with the landing-link class by default', () => {
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(anchor.className).toContain('landing-link');
    expect(anchor.className).not.toContain('landing-link--active');
  });

  it('renders external links with target=_blank and rel=noopener noreferrer', () => {
    fixture.componentRef.setInput('href', 'https://example.com');
    fixture.componentRef.setInput('external', true);
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('uses routerLink when href starts with "/"', () => {
    fixture.componentRef.setInput('href', '/projects');
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(anchor.getAttribute('href')).toBe('/projects');
    expect(anchor.getAttribute('target')).toBeNull();
  });

  it('renders trailing arrow stack (ghost + lead) when arrow input is true', () => {
    fixture.componentRef.setInput('arrow', true);
    fixture.detectChanges();
    const ghost = fixture.nativeElement.querySelector('.landing-link__arrow--ghost');
    const lead = fixture.nativeElement.querySelector('.landing-link__arrow--lead');
    expect(ghost).toBeTruthy();
    expect(lead).toBeTruthy();
  });

  it('uses up-right arrow glyph for external + arrow', () => {
    fixture.componentRef.setInput('href', 'https://example.com');
    fixture.componentRef.setInput('external', true);
    fixture.componentRef.setInput('arrow', true);
    fixture.detectChanges();
    const lead = fixture.nativeElement.querySelector('.landing-link__arrow--lead svg line') as SVGLineElement;
    expect(lead.getAttribute('x1')).toBe('7');
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(anchor.className).toContain('landing-link--arrow-up-right');
  });

  it('marks the link as active when active is true', () => {
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(anchor.className).toContain('landing-link--active');
    expect(anchor.getAttribute('aria-current')).toBe('page');
  });
});
