import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
  urlPrefix?: string | string[];
  timeout: number;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');
