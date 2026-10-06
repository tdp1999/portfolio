import { RadarDatasetCursorProps, RadarStepMeta } from '../radar-run.types';

/**
 * Where NORMALIZE is in a finished provider dataset. The offset moves by the page size, not by
 * what came back: a cleaned dataset page can hold fewer items than asked for.
 */
export class RadarDatasetCursor {
  private constructor(
    readonly datasetRef: string,
    readonly itemCount: number,
    readonly offset: number
  ) {
    Object.freeze(this);
  }

  // --- Factory Methods ---

  static start(datasetRef: string, itemCount: number): RadarDatasetCursor {
    return new RadarDatasetCursor(datasetRef, itemCount, 0);
  }

  /** Null when the step has not been handed a dataset yet. */
  static fromMeta(meta: RadarStepMeta): RadarDatasetCursor | null {
    if (meta.datasetRef === undefined) return null;
    return new RadarDatasetCursor(String(meta.datasetRef), Number(meta.itemCount ?? 0), Number(meta.offset ?? 0));
  }

  // --- Getters ---

  get exhausted(): boolean {
    return this.offset >= this.itemCount;
  }

  // --- Rules ---

  next(pageSize: number): RadarDatasetCursor {
    return new RadarDatasetCursor(this.datasetRef, this.itemCount, this.offset + pageSize);
  }

  toMeta(): RadarDatasetCursorProps {
    return { datasetRef: this.datasetRef, itemCount: this.itemCount, offset: this.offset };
  }
}
