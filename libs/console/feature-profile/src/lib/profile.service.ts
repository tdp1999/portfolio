import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, ApiService } from '@portfolio/console/shared/data-access';
import { map, timeout } from 'rxjs';

export interface ProfileAdminResponse {
  id: string;
  userId: string;
  fullName: { en: string; vi: string };
  title: { en: string; vi: string };
  bioShort: { en: string; vi: string };
  bioLong: { en?: string; vi?: string } | null;
  yearsOfExperience: number;
  availability: string;
  openTo: string[];
  email: string;
  phone: string | null;
  preferredContactPlatform: string;
  preferredContactValue: string;
  locationCountry: string;
  locationCity: string;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;
  socialLinks: Array<{ platform: string; url: string; handle?: string }>;
  resumeUrls: { en?: string; vi?: string };
  certifications: Array<{ name: string; issuer: string; year: number; url?: string }>;
  metaTitle: string | null;
  metaDescription: string | null;
  timezone: string | null;
  canonicalUrl: string | null;
  avatarId: string | null;
  ogImageId: string | null;
  avatarUrl: string | null;
  ogImageUrl: string | null;
}

export interface UpsertProfilePayload {
  fullName: { en: string; vi: string };
  title: { en: string; vi: string };
  bioShort: { en: string; vi: string };
  bioLong?: { en?: string; vi?: string };
  yearsOfExperience: number;
  availability: string;
  openTo: string[];
  email: string;
  phone?: string;
  preferredContactPlatform: string;
  preferredContactValue: string;
  locationCountry: string;
  locationCity: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;
  socialLinks: Array<{ platform: string; url: string; handle?: string }>;
  resumeUrls: { en?: string; vi?: string };
  certifications: Array<{ name: string; issuer: string; year: number; url?: string }>;
  metaTitle?: string;
  metaDescription?: string;
  timezone?: string;
  canonicalUrl?: string;
  avatarId?: string;
  ogImageId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  getProfile() {
    return this.api.get<ProfileAdminResponse>('/admin/profile');
  }

  upsert(data: UpsertProfilePayload) {
    return this.api.put<{ id: string }>('/admin/profile', data);
  }

  getJsonLd(locale: 'en' | 'vi' = 'en') {
    return this.api.get<unknown>(`/profile/json-ld`, { params: { locale } });
  }

  uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post(this.buildUrl('/media/upload'), formData, { withCredentials: true, responseType: 'text' })
      .pipe(
        timeout(this.apiConfig.timeout),
        map((id) => id.trim())
      );
  }

  private buildUrl(endpoint: string): string {
    const normalized = endpoint.replace(/^\//, '');
    const prefixes = Array.isArray(this.apiConfig.urlPrefix) ? this.apiConfig.urlPrefix : [this.apiConfig.urlPrefix];
    const prefix = prefixes.filter(Boolean).join('/');
    return prefix ? `${this.apiConfig.baseUrl}/${prefix}/${normalized}` : `${this.apiConfig.baseUrl}/${normalized}`;
  }
}
