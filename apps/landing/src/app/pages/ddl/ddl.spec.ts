import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIcons, lucideProvider } from '@portfolio/landing/shared/ui';
import { Ddl } from './ddl';
import { DdlDocsService } from './ddl-docs.service';

describe('Ddl (docs overview)', () => {
  let component: Ddl;
  let fixture: ComponentFixture<Ddl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ddl],
      // DdlDocsService is normally provided by the DdlShell; the overview renders
      // a standalone <landing-ddl-doc-page> that injects it, so supply it here.
      providers: [provideRouter([]), provideIcons(lucideProvider), DdlDocsService],
    }).compileComponents();

    fixture = TestBed.createComponent(Ddl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the overview title in the doc-page header', () => {
    expect(fixture.nativeElement.textContent).toContain('Design Definition Language');
  });

  it('should render the overview content sections', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('What is the DDL?');
    expect(text).toContain("How it's organized");
  });
});
