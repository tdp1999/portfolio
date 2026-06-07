import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  describe('adding toasts', () => {
    it('should add a success toast', () => {
      service.success('Done!');
      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Done!');
      expect(toasts[0].duration).toBe(5000);
    });

    it('should add an error toast', () => {
      service.error('Failed');
      expect(service.toasts()[0].type).toBe('error');
    });

    it('should add a warning toast', () => {
      service.warning('Careful');
      expect(service.toasts()[0].type).toBe('warning');
    });

    it('should add an info toast', () => {
      service.info('FYI');
      expect(service.toasts()[0].type).toBe('info');
    });

    it('should support custom duration', () => {
      service.success('Quick', 2000);
      expect(service.toasts()[0].duration).toBe(2000);
    });

    it('should stack multiple toasts', () => {
      service.success('First');
      service.error('Second');
      service.info('Third');
      expect(service.toasts()).toHaveLength(3);
    });

    it('should assign unique ids', () => {
      service.success('A');
      service.success('B');
      const ids = service.toasts().map((t) => t.id);
      expect(ids[0]).not.toBe(ids[1]);
    });
  });

  describe('dismiss', () => {
    it('should remove a toast by id', () => {
      service.success('Keep');
      service.error('Remove');
      const removeId = service.toasts()[1].id;

      service.dismiss(removeId);

      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].message).toBe('Keep');
    });

    it('should do nothing for unknown id', () => {
      service.success('Stay');
      service.dismiss('nonexistent');
      expect(service.toasts()).toHaveLength(1);
    });
  });
});
