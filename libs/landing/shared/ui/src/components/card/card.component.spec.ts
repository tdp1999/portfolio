import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';
import { Component } from '@angular/core';

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
    it('should have elevated input default to false', () => {
      expect(component.elevated()).toBe(false);
    });

    it('should render with base card class', () => {
      const cardElement = fixture.nativeElement.querySelector('.card');
      expect(cardElement).toBeTruthy();
    });

    it('should not have elevated class by default', () => {
      const cardElement = fixture.nativeElement.querySelector('.card--elevated');
      expect(cardElement).toBeFalsy();
    });
  });

  describe('elevated state', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('elevated', true);
      fixture.detectChanges();
    });

    it('should apply elevated class when elevated is true', () => {
      const cardElement = fixture.nativeElement.querySelector('.card--elevated');
      expect(cardElement).toBeTruthy();
    });

    it('should compute cardClasses correctly with elevated true', () => {
      expect(component.cardClasses()).toBe('card card--elevated');
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

      const projectedContent = hostFixture.nativeElement.querySelector('.test-content');
      expect(projectedContent).toBeTruthy();
      expect(projectedContent.textContent).toContain('Test Content');
    });
  });

  describe('BEM sub-component classes', () => {
    @Component({
      imports: [CardComponent],
      template: `
        <landing-card>
          <div class="card__header">Header</div>
          <div class="card__content">Content</div>
          <div class="card__footer">Footer</div>
        </landing-card>
      `,
    })
    class TestCardWithSubComponentsComponent {}

    it('should support card__header class', () => {
      const hostFixture = TestBed.createComponent(TestCardWithSubComponentsComponent);
      hostFixture.detectChanges();

      const header = hostFixture.nativeElement.querySelector('.card__header');
      expect(header).toBeTruthy();
      expect(header.textContent).toContain('Header');
    });

    it('should support card__content class', () => {
      const hostFixture = TestBed.createComponent(TestCardWithSubComponentsComponent);
      hostFixture.detectChanges();

      const content = hostFixture.nativeElement.querySelector('.card__content');
      expect(content).toBeTruthy();
      expect(content.textContent).toContain('Content');
    });

    it('should support card__footer class', () => {
      const hostFixture = TestBed.createComponent(TestCardWithSubComponentsComponent);
      hostFixture.detectChanges();

      const footer = hostFixture.nativeElement.querySelector('.card__footer');
      expect(footer).toBeTruthy();
      expect(footer.textContent).toContain('Footer');
    });
  });

  describe('cardClasses computed signal', () => {
    it('should return only "card" when elevated is false', () => {
      fixture.componentRef.setInput('elevated', false);
      fixture.detectChanges();

      expect(component.cardClasses()).toBe('card');
    });

    it('should return "card card--elevated" when elevated is true', () => {
      fixture.componentRef.setInput('elevated', true);
      fixture.detectChanges();

      expect(component.cardClasses()).toBe('card card--elevated');
    });

    it('should react to input changes', () => {
      // Start with false
      fixture.componentRef.setInput('elevated', false);
      fixture.detectChanges();
      expect(component.cardClasses()).toBe('card');

      // Change to true
      fixture.componentRef.setInput('elevated', true);
      fixture.detectChanges();
      expect(component.cardClasses()).toBe('card card--elevated');

      // Change back to false
      fixture.componentRef.setInput('elevated', false);
      fixture.detectChanges();
      expect(component.cardClasses()).toBe('card');
    });
  });
});
