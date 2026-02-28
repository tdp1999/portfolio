import { ErrorLayer } from './error-layer';

export interface ErrorOptions {
  errorCode: string;
  remarks?: string;
  layer?: ErrorLayer;
}
