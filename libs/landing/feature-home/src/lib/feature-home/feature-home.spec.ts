import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureHome } from './feature-home';

describe('FeatureHome', () => {
  let component: FeatureHome;
  let fixture: ComponentFixture<FeatureHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureHome],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
