import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PullQuoteComponent } from './pull-quote.component';

@Component({
  standalone: true,
  imports: [PullQuoteComponent],
  template: `<landing-pull-quote [cite]="cite">{{ body }}</landing-pull-quote>`,
})
class HostComponent {
  body = '';
  cite = '';
}

describe('PullQuoteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('landing-pull-quote')).toBeTruthy();
  });

  it('should project content into the body', () => {
    host.body = 'Design is how it works.';
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.landing-pull-quote__body');
    expect(body.textContent.trim()).toBe('Design is how it works.');
  });

  it('should not render cite footer when cite is empty', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.landing-pull-quote__cite')).toBeNull();
  });

  it('should render cite footer when cite is provided', () => {
    host.cite = 'Steve Jobs';
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('.landing-pull-quote__cite');
    expect(footer.textContent).toContain('Steve Jobs');
  });
});
