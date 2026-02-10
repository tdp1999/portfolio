import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionComponent } from './section.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('SectionComponent', () => {
  let component: SectionComponent;
  let fixture: ComponentFixture<SectionComponent>;
  let sectionEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionComponent);
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
    fixture = TestBed.createComponent(SectionComponent);
    const compiled = fixture.nativeElement;
    compiled.innerHTML = testContent;
    fixture.detectChanges();

    expect(compiled.textContent).toContain(testContent);
  });
});
