import { TestBed } from '@angular/core/testing';
import { SpinnerService } from './spinner.service';

describe('SpinnerService', () => {
  let service: SpinnerService;

  beforeEach(() => {
    service = TestBed.inject(SpinnerService);
  });

  it('should start hidden', () => {
    expect(service.visible()).toBe(false);
  });

  it('should show spinner', () => {
    service.show();
    expect(service.visible()).toBe(true);
  });

  it('should hide spinner', () => {
    service.show();
    service.hide();
    expect(service.visible()).toBe(false);
  });
});
