/** Live npm registry numbers for one package. */
export interface NpmStat {
  readonly version: string;
  /** Weekly downloads, or null when the downloads API did not answer. */
  readonly downloads: number | null;
}
