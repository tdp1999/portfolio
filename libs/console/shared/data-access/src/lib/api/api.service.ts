import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface RequestOptions {
  params?: Record<string, string>;
  context?: HttpContext;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  private readonly defaultOptions = { withCredentials: true };

  get<T = unknown>(url: string, options?: RequestOptions): Observable<T> {
    return this.http
      .get<T>(this.buildUrl(url), { ...this.defaultOptions, ...options })
      .pipe(timeout(this.config.timeout));
  }

  post<T = unknown>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .post<T>(this.buildUrl(url), body, { ...this.defaultOptions, ...options })
      .pipe(timeout(this.config.timeout));
  }

  put<T = unknown>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .put<T>(this.buildUrl(url), body, { ...this.defaultOptions, ...options })
      .pipe(timeout(this.config.timeout));
  }

  patch<T = unknown>(url: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .patch<T>(this.buildUrl(url), body, { ...this.defaultOptions, ...options })
      .pipe(timeout(this.config.timeout));
  }

  delete<T = unknown>(url: string, options?: RequestOptions): Observable<T> {
    return this.http
      .delete<T>(this.buildUrl(url), { ...this.defaultOptions, ...options })
      .pipe(timeout(this.config.timeout));
  }

  private buildUrl(endpoint: string): string {
    const normalized = endpoint.replace(/^\//, '');
    const prefixes = Array.isArray(this.config.urlPrefix)
      ? this.config.urlPrefix
      : [this.config.urlPrefix];
    const prefix = prefixes.filter(Boolean).join('/');
    return prefix
      ? `${this.config.baseUrl}/${prefix}/${normalized}`
      : `${this.config.baseUrl}/${normalized}`;
  }
}
