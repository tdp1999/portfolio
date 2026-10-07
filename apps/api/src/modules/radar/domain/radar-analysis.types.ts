/** How much a fact check matters: `major` means the post misleads on its main claim, and the console warns. */
export type RadarFactCheckSeverity = 'minor' | 'major';

/** How far the server analysis went: a quick pass for every item, research only for the best ones. */
export type RadarAnalysisDepth = 'light' | 'deep';

/** A page the analysis used as evidence. */
export interface RadarSource {
  url: string;
  title: string | null;
}
