/** Resolved display source for one slide. */
export interface ResolvedSource {
  readonly src: string;
  readonly srcset: string | null;
  readonly download: string;
}
