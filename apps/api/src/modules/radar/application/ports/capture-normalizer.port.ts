import { RadarNormalizeResult } from '../../domain/radar.types';

/**
 * Turns one provider's export format into {@link NormalizedRadarItem}s. Pure and stateless:
 * the Manual flow feeds it an uploaded file, the Hybrid flow (task 409) feeds it a fetched
 * Apify dataset.
 */
export interface ICaptureNormalizer {
  /** Format key the upload route selects by, e.g. `apify-facebook-posts`. */
  readonly format: string;
  normalize(raw: readonly unknown[]): RadarNormalizeResult;
}
