import { API_CONFIG, ApiConfig } from './api.config';

export function provideApi(config: ApiConfig) {
  return [{ provide: API_CONFIG, useValue: config }];
}
