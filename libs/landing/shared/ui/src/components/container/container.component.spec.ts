import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContainerComponent } from './container.component';
import { By } from '@angular/platform-browser';

describe('ContainerComponent', () => {
  let component: ContainerComponent;
  let fixture: ComponentFixture<ContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a div with container class', () => {
    const containerEl = fixture.debugElement.query(By.css('.container'));
    expect(containerEl).toBeTruthy();
    expect(containerEl.nativeElement.classList.contains('container')).toBe(true);
  });

  it('should project content', () => {
    const testContent = 'Test Content';
    fixture = TestBed.createComponent(ContainerComponent);
    const compiled = fixture.nativeElement;
    compiled.innerHTML = testContent;
    fixture.detectChanges();

    expect(compiled.textContent).toContain(testContent);
  });

  describe('wide input', () => {
    it('should not have container--wide class by default', () => {
      const el = fixture.nativeElement.querySelector('.container');
      expect(el.classList.contains('container--wide')).toBe(false);
    });

    it('should add container--wide class when wide is true', () => {
      fixture.componentRef.setInput('wide', true);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.container');
      expect(el.classList.contains('container--wide')).toBe(true);
    });

    it('should remove container--wide class when wide is false', () => {
      fixture.componentRef.setInput('wide', true);
      fixture.detectChanges();
      let el = fixture.nativeElement.querySelector('.container');
      expect(el.classList.contains('container--wide')).toBe(true);

      fixture.componentRef.setInput('wide', false);
      fixture.detectChanges();
      el = fixture.nativeElement.querySelector('.container');
      expect(el.classList.contains('container--wide')).toBe(false);
    });
  });
});
