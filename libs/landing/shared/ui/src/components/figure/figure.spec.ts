import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Figure } from './figure';

describe('FigureComponent', () => {
  let component: Figure;
  let fixture: ComponentFixture<Figure>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Figure],
    }).compileComponents();

    fixture = TestBed.createComponent(Figure);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('src', '/img/test.png');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the image with src and alt', () => {
    fixture.componentRef.setInput('alt', 'Test image');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('/img/test.png');
    expect(img.getAttribute('alt')).toBe('Test image');
  });

  it('should default to lazy loading', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('should drop lazy loading and add fetchpriority when preload is true', () => {
    fixture.componentRef.setInput('preload', true);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('loading')).toBeNull();
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });

  it('should pass srcset through when provided', () => {
    fixture.componentRef.setInput('srcset', '/img/test.png 1x, /img/test@2x.png 2x');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('srcset')).toBe('/img/test.png 1x, /img/test@2x.png 2x');
  });

  it('should not render a caption when caption is empty', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('figcaption')).toBeNull();
  });

  it('should render caption with figure number padded to two digits', () => {
    fixture.componentRef.setInput('caption', 'Hero shot');
    fixture.componentRef.setInput('figureNumber', 3);
    fixture.detectChanges();
    const fig = fixture.nativeElement.querySelector('figcaption');
    expect(fig.textContent).toContain('FIG. 03');
    expect(fig.textContent).toContain('Hero shot');
  });

  it('should render caption without number when figureNumber is null', () => {
    fixture.componentRef.setInput('caption', 'Screenshot');
    fixture.detectChanges();
    const fig = fixture.nativeElement.querySelector('figcaption');
    expect(fig.querySelector('.landing-figure__number')).toBeNull();
    expect(fig.textContent).toContain('Screenshot');
  });
});
