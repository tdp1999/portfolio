import { ErrorLayer } from './error-layer';

export interface ErrorOptions {
  errorCode?: string | null;
  remarks?: string;
  layer?: ErrorLayer;
}
