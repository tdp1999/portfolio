import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default state', () => {
    it('should render the base card class', () => {
      expect(fixture.nativeElement.querySelector('.card')).toBeTruthy();
    });

    it('should default tilt to false', () => {
      expect(component.tilt()).toBe(false);
    });

    it('should not apply card--tilt by default', () => {
      expect(fixture.nativeElement.querySelector('.card--tilt')).toBeFalsy();
    });
  });

  describe('tilt modifier', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('tilt', true);
      fixture.detectChanges();
    });

    it('should apply card--tilt class when tilt is true', () => {
      expect(fixture.nativeElement.querySelector('.card--tilt')).toBeTruthy();
    });

    it('should compose classes as "card card--tilt"', () => {
      expect(component.cardClasses()).toBe('card card--tilt');
    });
  });

  describe('content projection', () => {
    @Component({
      imports: [CardComponent],
      template: `
        <landing-card>
          <div class="test-content">Test Content</div>
        </landing-card>
      `,
    })
    class TestHostComponent {}

    it('should project content into the card', () => {
      const hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();

      const projected = hostFixture.nativeElement.querySelector('.test-content');
      expect(projected).toBeTruthy();
      expect(projected.textContent).toContain('Test Content');
    });
  });
});
