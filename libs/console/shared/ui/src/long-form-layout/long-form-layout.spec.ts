import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LongFormLayout } from './long-form-layout';

@Component({
  standalone: true,
  imports: [LongFormLayout],
  template: `
    <console-long-form-layout>
      <div rail class="test-rail">Rail content</div>
      <div content class="test-content">Main content</div>
    </console-long-form-layout>
  `,
})
class TestHostComponent {}

describe('LongFormLayoutComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should render with grid layout', () => {
    expect(el.querySelector('.long-form-layout')).toBeTruthy();
  });

  it('should project rail content into the rail slot', () => {
    const rail = el.querySelector('.long-form-layout__rail');
    expect(rail?.querySelector('.test-rail')?.textContent).toBe('Rail content');
  });

  it('should project main content into the content slot', () => {
    const content = el.querySelector('.long-form-layout__content');
    expect(content?.querySelector('.test-content')?.textContent).toBe('Main content');
  });

  it('should default collapseSidebar to true', () => {
    const layout = fixture.debugElement.children[0].componentInstance as LongFormLayout;
    expect(layout.collapseSidebar()).toBe(true);
  });
});
