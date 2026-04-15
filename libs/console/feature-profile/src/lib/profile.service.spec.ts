import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { API_CONFIG, ApiService } from '@portfolio/console/shared/data-access';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from './profile.service';
import {
  UpdateContactPayload,
  UpdateIdentityPayload,
  UpdateLocationPayload,
  UpdateSeoOgPayload,
  UpdateSocialLinksPayload,
  UpdateWorkAvailabilityPayload,
} from './profile.types';

describe('ProfileService', () => {
  let service: ProfileService;
  let api: { get: jest.Mock; post: jest.Mock; put: jest.Mock; patch: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    api = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn().mockReturnValue(of(undefined)),
      delete: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ProfileService,
        { provide: ApiService, useValue: api },
        { provide: HttpClient, useValue: { post: jest.fn() } },
        { provide: API_CONFIG, useValue: { baseUrl: '', urlPrefix: 'api', timeout: 30_000 } },
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  it('getProfile calls GET /admin/profile', () => {
    api.get.mockReturnValue(of({}));
    service.getProfile().subscribe();
    expect(api.get).toHaveBeenCalledWith('/admin/profile');
  });

  it('updateIdentity calls PATCH /admin/profile/identity with payload', () => {
    const payload: UpdateIdentityPayload = {
      fullName: { en: 'Phuong Tran', vi: 'Phương Trần' },
      title: { en: 'Engineer', vi: 'Kỹ sư' },
      bioShort: { en: 'Short', vi: 'Ngắn' },
      bioLong: null,
    };
    service.updateIdentity(payload).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/identity', payload);
  });

  it('updateWorkAvailability calls PATCH /admin/profile/work-availability', () => {
    const payload: UpdateWorkAvailabilityPayload = {
      yearsOfExperience: 10,
      availability: 'EMPLOYED',
      openTo: ['FREELANCE'],
      timezone: 'Asia/Ho_Chi_Minh',
    };
    service.updateWorkAvailability(payload).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/work-availability', payload);
  });

  it('updateContact calls PATCH /admin/profile/contact', () => {
    const payload: UpdateContactPayload = {
      email: 'hello@thunderphong.com',
      phone: null,
      preferredContactPlatform: 'GITHUB',
      preferredContactValue: 'phuong',
    };
    service.updateContact(payload).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/contact', payload);
  });

  it('updateLocation calls PATCH /admin/profile/location', () => {
    const payload: UpdateLocationPayload = {
      locationCountry: 'VN',
      locationCity: 'Ho Chi Minh',
      locationPostalCode: null,
      locationAddress1: null,
      locationAddress2: null,
    };
    service.updateLocation(payload).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/location', payload);
  });

  it('updateSocialLinks calls PATCH /admin/profile/social-links', () => {
    const payload: UpdateSocialLinksPayload = {
      socialLinks: [{ platform: 'GITHUB', url: 'https://github.com/phuong' }],
      resumeUrls: {},
      certifications: [],
    };
    service.updateSocialLinks(payload).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/social-links', payload);
  });

  it('updateSeoOg calls PATCH /admin/profile/seo-og', () => {
    const payload: UpdateSeoOgPayload = {
      metaTitle: 'Title',
      metaDescription: null,
      canonicalUrl: null,
    };
    service.updateSeoOg(payload).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/seo-og', payload);
  });

  it('updateAvatar calls PATCH /admin/profile/avatar with avatarId', () => {
    service.updateAvatar('abc-123').subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/avatar', { avatarId: 'abc-123' });

    service.updateAvatar(null).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/avatar', { avatarId: null });
  });

  it('updateOgImage calls PATCH /admin/profile/og-image with ogImageId', () => {
    service.updateOgImage('og-1').subscribe();
    expect(api.patch).toHaveBeenCalledWith('/admin/profile/og-image', { ogImageId: 'og-1' });
  });

  it('does not expose an upsert() method', () => {
    expect((service as unknown as Record<string, unknown>)['upsert']).toBeUndefined();
  });
});
