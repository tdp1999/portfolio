import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Section } from './section';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('SectionComponent', () => {
  let component: Section;
  let fixture: ComponentFixture<Section>;
  let sectionEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Section],
    }).compileComponents();

    fixture = TestBed.createComponent(Section);
    component = fixture.componentInstance;
    sectionEl = fixture.debugElement.query(By.css('section'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a section element with section class', () => {
    expect(sectionEl).toBeTruthy();
    expect(sectionEl.nativeElement.tagName).toBe('SECTION');
    expect(sectionEl.nativeElement.classList.contains('section')).toBe(true);
  });

  it('should project content', () => {
    const testContent = 'Section Content';
    fixture = TestBed.createComponent(Section);
    const compiled = fixture.nativeElement;
    compiled.innerHTML = testContent;
    fixture.detectChanges();

    expect(compiled.textContent).toContain(testContent);
  });
});
