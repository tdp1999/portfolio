import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FE_TO_BE_PURPOSE,
  type ContactFormInput,
  type ContactSubmitPayload,
  type ContactSubmitResponse,
} from './contact-form.types';

@Injectable({ providedIn: 'root' })
export class ContactFormService {
  private readonly http = inject(HttpClient);

  submit(input: ContactFormInput): Observable<ContactSubmitResponse> {
    const payload: ContactSubmitPayload = {
      name: input.name,
      email: input.email,
      message: input.message,
      website: input.website,
      purpose: FE_TO_BE_PURPOSE[input.purpose],
      locale: input.locale,
      consentGivenAt: new Date().toISOString(),
      ...(input.turnstileToken ? { turnstileToken: input.turnstileToken } : {}),
    };
    return this.http.post<ContactSubmitResponse>('/api/contact-messages', payload);
  }
}
