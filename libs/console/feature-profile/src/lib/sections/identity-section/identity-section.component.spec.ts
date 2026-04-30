import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { API_CONFIG, ApiService, MediaService } from '@portfolio/console/shared/data-access';
import { ToastService, MediaPickerDataSource } from '@portfolio/console/shared/ui';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';
import { IdentitySectionComponent } from './identity-section.component';

const MOCK_PROFILE: ProfileAdminResponse = {
  id: 'p-1',
  userId: 'u-1',
  fullName: { en: 'Phuong Tran', vi: 'Phương Trần' },
  title: { en: 'Engineer', vi: 'Kỹ sư' },
  bioShort: { en: 'Short bio', vi: 'Tiểu sử ngắn' },
  bioLong: null,
  yearsOfExperience: 10,
  availability: 'EMPLOYED',
  openTo: [],
  email: 'a@b.c',
  phone: null,
  preferredContactPlatform: 'GITHUB',
  preferredContactValue: 'phuong',
  locationCountry: 'VN',
  locationCity: 'HCM',
  locationPostalCode: null,
  locationAddress1: null,
  locationAddress2: null,
  socialLinks: [],
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

const stubDataSource: MediaPickerDataSource = {
  list: () => of({ data: [], total: 0 }) as never,
  upload: () => of(null) as never,
  getById: () => of(null) as never,
  getByIdSilent: () => of(null) as never,
};

describe('IdentitySectionComponent', () => {
  let component: IdentitySectionComponent;
  let fixture: ComponentFixture<IdentitySectionComponent>;
  let profileService: { updateIdentity: jest.Mock; updateAvatar: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };

  beforeEach(async () => {
    profileService = {
      updateIdentity: jest.fn().mockReturnValue(of(undefined)),
      updateAvatar: jest.fn().mockReturnValue(of(undefined)),
    };
    toast = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [IdentitySectionComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProfileService, useValue: profileService },
        { provide: MediaService, useValue: {} },
        { provide: ToastService, useValue: toast },
        { provide: ApiService, useValue: {} },
        { provide: API_CONFIG, useValue: { baseUrl: '', urlPrefix: 'api', timeout: 30_000 } },
      ],
    })
      .overrideComponent(IdentitySectionComponent, { set: { template: '<div>test</div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(IdentitySectionComponent);
    fixture.componentRef.setInput('initialData', MOCK_PROFILE);
    fixture.componentRef.setInput('mediaDataSource', stubDataSource);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('hydrates form from initialData on first input', () => {
    expect(component.form.controls.fullName.value).toEqual({ en: 'Phuong Tran', vi: 'Phương Trần' });
    expect(component.form.controls.bioLong.value).toEqual({ en: '', vi: '' });
  });

  it('does not call API when form is invalid', () => {
    component.form.controls.fullName.controls.en.setValue('');
    component.form.markAsDirty();
    component.save();
    expect(profileService.updateIdentity).not.toHaveBeenCalled();
  });

  it('saves and emits patch on success', () => {
    let patch: Partial<ProfileAdminResponse> | null = null;
    component.saved.subscribe((p) => (patch = p));

    component.form.controls.fullName.controls.en.setValue('Updated');
    component.form.markAsDirty();
    component.save();

    expect(profileService.updateIdentity).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Identity saved');
    expect(component.saving()).toBe(false);
    expect(component.lastSaved()).toBeInstanceOf(Date);
    expect(patch).not.toBeNull();
    expect(patch!.fullName).toEqual({ en: 'Updated', vi: 'Phương Trần' });
  });

  it('clears saving spinner on API error and does not emit patch', () => {
    const err$ = new Subject<void>();
    profileService.updateIdentity.mockReturnValue(err$);

    let patch: Partial<ProfileAdminResponse> | null = null;
    component.saved.subscribe((p) => (patch = p));

    component.form.controls.fullName.controls.en.setValue('Will Fail');
    component.form.markAsDirty();
    component.save();

    expect(component.saving()).toBe(true);

    err$.error(new HttpErrorResponse({ status: 400, error: { errorCode: 'PROFILE_INVALID_INPUT' } }));

    expect(component.saving()).toBe(false);
    expect(component.lastSaved()).toBeNull();
    expect(patch).toBeNull();
  });
});
