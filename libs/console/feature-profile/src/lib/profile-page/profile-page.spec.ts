import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { API_CONFIG, ApiService } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';
import { SidebarState } from '@portfolio/shared/ui/sidebar';
import { ProfileService } from '../profile.service';
import { ProfileAdminResponse } from '../profile.types';
import ProfilePageComponent from './profile-page';

/** Minimal profile response for seeding the form. */
const MOCK_PROFILE: ProfileAdminResponse = {
  id: 'p-1',
  userId: 'u-1',
  fullName: { en: 'Phuong Tran', vi: 'Phương Trần' },
  title: { en: 'Engineer', vi: 'Kỹ sư' },
  bioShort: { en: 'Short bio', vi: 'Tiểu sử ngắn' },
  bioLong: null,
  yearsOfExperience: 10,
  availability: 'EMPLOYED',
  openTo: ['FREELANCE'],
  email: 'hello@thunderphong.com',
  phone: null,
  preferredContactPlatform: 'GITHUB',
  preferredContactValue: 'phuong',
  locationCountry: 'VN',
  locationCity: 'Ho Chi Minh',
  locationPostalCode: null,
  locationAddress1: null,
  locationAddress2: null,
  socialLinks: [{ platform: 'GITHUB', url: 'https://github.com/phuong' }],
  resumeUrls: {},
  certifications: [],
  metaTitle: null,
  metaDescription: null,
  timezone: 'Asia/Ho_Chi_Minh',
  canonicalUrl: null,
  avatarId: null,
  ogImageId: null,
  avatarUrl: null,
  ogImageUrl: null,
};

describe('ProfilePageComponent', () => {
  let component: ProfilePageComponent;
  let fixture: ComponentFixture<ProfilePageComponent>;
  let profileService: {
    getProfile: jest.Mock;
    updateIdentity: jest.Mock;
    updateWorkAvailability: jest.Mock;
    updateContact: jest.Mock;
    updateLocation: jest.Mock;
    updateSocialLinks: jest.Mock;
    updateSeoOg: jest.Mock;
    updateAvatar: jest.Mock;
    updateOgImage: jest.Mock;
    uploadMedia: jest.Mock;
    getJsonLd: jest.Mock;
  };
  let toast: { success: jest.Mock; error: jest.Mock };
  let sidebarState: { isOpen: jest.Mock; setOpen: jest.Mock };

  beforeEach(async () => {
    profileService = {
      getProfile: jest.fn().mockReturnValue(of(MOCK_PROFILE)),
      updateIdentity: jest.fn().mockReturnValue(of(undefined)),
      updateWorkAvailability: jest.fn().mockReturnValue(of(undefined)),
      updateContact: jest.fn().mockReturnValue(of(undefined)),
      updateLocation: jest.fn().mockReturnValue(of(undefined)),
      updateSocialLinks: jest.fn().mockReturnValue(of(undefined)),
      updateSeoOg: jest.fn().mockReturnValue(of(undefined)),
      updateAvatar: jest.fn().mockReturnValue(of(undefined)),
      updateOgImage: jest.fn().mockReturnValue(of(undefined)),
      uploadMedia: jest.fn(),
      getJsonLd: jest.fn(),
    };
    toast = { success: jest.fn(), error: jest.fn() };
    sidebarState = { isOpen: jest.fn().mockReturnValue(true), setOpen: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProfileService, useValue: profileService },
        { provide: ToastService, useValue: toast },
        { provide: SidebarState, useValue: sidebarState },
        { provide: ApiService, useValue: {} },
        { provide: API_CONFIG, useValue: { baseUrl: '', urlPrefix: 'api', timeout: 30_000 } },
      ],
    })
      .overrideComponent(ProfilePageComponent, {
        set: { template: '<div>test</div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit → loadProfile
  });

  it('should create and load profile on init', () => {
    expect(component).toBeTruthy();
    expect(profileService.getProfile).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('collapses sidebar on init and restores on destroy', () => {
    expect(sidebarState.setOpen).toHaveBeenCalledWith(false);

    fixture.destroy();
    // Should restore the previous state (true)
    expect(sidebarState.setOpen).toHaveBeenCalledWith(true);
  });

  // ── Section save success ──────────────────────────────────────────────────

  describe('section save success', () => {
    it('saveIdentity calls PATCH and marks pristine with lastSavedAt', () => {
      // Make identity dirty
      component.identityForm.get('fullName')?.get('en')?.setValue('New Name');
      component.identityForm.markAsDirty();
      fixture.detectChanges();

      component.saveIdentity();

      expect(profileService.updateIdentity).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: { en: 'New Name', vi: 'Phương Trần' },
        })
      );
      expect(component.savingSignals.identity()).toBe(false);
      expect(component.lastSavedSignals.identity()).toBeInstanceOf(Date);
      expect(toast.success).toHaveBeenCalledWith('Identity saved');
    });

    it('saveContact calls PATCH with correct payload', () => {
      component.contactForm.get('email')?.setValue('new@example.com');
      component.contactForm.markAsDirty();

      component.saveContact();

      expect(profileService.updateContact).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', phone: null })
      );
      expect(component.lastSavedSignals.contact()).toBeInstanceOf(Date);
    });

    it('saveLocation calls PATCH with nullified empty optional fields', () => {
      component.locationForm.patchValue({
        locationCountry: 'US',
        locationCity: 'NYC',
        locationPostalCode: '',
        locationAddress1: '',
        locationAddress2: '',
      });
      component.locationForm.markAsDirty();

      component.saveLocation();

      expect(profileService.updateLocation).toHaveBeenCalledWith({
        locationCountry: 'US',
        locationCity: 'NYC',
        locationPostalCode: null,
        locationAddress1: null,
        locationAddress2: null,
      });
    });

    it('saveSeoOg calls PATCH with nullified empty fields', () => {
      component.seoOgForm.patchValue({
        metaTitle: 'My Title',
        metaDescription: '',
        canonicalUrl: '',
      });
      component.seoOgForm.markAsDirty();

      component.saveSeoOg();

      expect(profileService.updateSeoOg).toHaveBeenCalledWith({
        metaTitle: 'My Title',
        metaDescription: null,
        canonicalUrl: null,
      });
    });
  });

  // ── Section save error (rollback) ─────────────────────────────────────────

  describe('section save error', () => {
    it('rolls back identity form on API error and sets error signal', () => {
      const error$ = new Subject<void>();
      profileService.updateIdentity.mockReturnValue(error$);

      // Set a known value
      component.identityForm.get('fullName')?.get('en')?.setValue('Will Fail');
      component.identityForm.markAsDirty();

      component.saveIdentity();

      // During save: saving signal is true, form is optimistically pristine
      expect(component.savingSignals.identity()).toBe(true);

      // Emit error
      const httpErr = new HttpErrorResponse({
        error: { message: 'Validation failed', errorCode: 'VALIDATION' },
        status: 422,
      });
      error$.error(httpErr);

      // After error: saving false, error signal set, form dirty (rolled back)
      expect(component.savingSignals.identity()).toBe(false);
      expect(component.errorSignals.identity()).toBe('Validation failed');
      expect(component.identityForm.dirty).toBe(true);
      // The rolled-back value should be the snapshot taken before save
      expect(component.identityForm.get('fullName')?.get('en')?.value).toBe('Will Fail');
      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });

    it('does not call API when form is invalid', () => {
      // Clear required field to make form invalid
      component.identityForm.get('fullName')?.get('en')?.setValue('');
      component.identityForm.markAsDirty();

      component.saveIdentity();

      expect(profileService.updateIdentity).not.toHaveBeenCalled();
      expect(component.errorSignals.identity()).toBe('Fix errors before saving');
    });
  });

  // ── Dirty state propagation ───────────────────────────────────────────────

  describe('dirty state propagation', () => {
    it('isDirty is false when no section is dirty', () => {
      expect(component.isDirty()).toBe(false);
    });

    it('isDirty becomes true when any single section is dirty', () => {
      component.contactForm.get('email')?.setValue('changed@example.com');
      component.contactForm.markAsDirty();
      // Trigger form events sync
      fixture.detectChanges();

      expect(component.isDirty()).toBe(true);
    });

    it('isDirty OR-s all 6 sections', () => {
      // Dirty identity
      component.identityForm.get('fullName')?.get('en')?.setValue('X');
      component.identityForm.markAsDirty();
      fixture.detectChanges();
      expect(component.isDirty()).toBe(true);

      // Reset identity, dirty seoOg
      component.identityForm.markAsPristine();
      component.seoOgForm.get('metaTitle')?.setValue('Title');
      component.seoOgForm.markAsDirty();
      fixture.detectChanges();
      expect(component.isDirty()).toBe(true);

      // Reset all
      component.seoOgForm.markAsPristine();
      fixture.detectChanges();
      expect(component.isDirty()).toBe(false);
    });
  });

  // ── Guard integration ─────────────────────────────────────────────────────

  describe('guard integration', () => {
    it('hasUnsavedChanges() returns the isDirty signal', () => {
      const guard = component.hasUnsavedChanges();
      expect(guard()).toBe(false);

      component.locationForm.get('locationCity')?.setValue('New City');
      component.locationForm.markAsDirty();
      fixture.detectChanges();

      expect(guard()).toBe(true);
    });
  });
});
