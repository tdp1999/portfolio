import { RadarFactCheckSeverity } from '../radar-analysis.types';

/** Rules the server analysis applies around the model: what it may read and what it may claim. */
export class RadarAnalysisPolicy {
  // --- Constants ---

  /** Facebook pages, short links and CDN: they need a login, and Radar never uses the Owner's accounts (RAD-003). */
  private static readonly SOCIAL_HOST = /(^|\.)(facebook\.com|fb\.com|fb\.watch|fb\.me|fbcdn\.net|messenger\.com)$/i;
  private static readonly URL_IN_TEXT = /https?:\/\/[^\s)<>"']+/gi;
  static readonly REMOVED_LINK = '[facebook link removed]';

  // --- Rules ---

  /** True for a URL the analysis must not send to the provider (it could fetch it). Unparseable URLs count as blocked. */
  static isBlockedUrl(url: string): boolean {
    try {
      return RadarAnalysisPolicy.SOCIAL_HOST.test(new URL(url).hostname);
    } catch {
      return true;
    }
  }

  /** The text with every blocked URL replaced, so the provider's URL reader never sees one. */
  static stripBlockedUrls(text: string): string {
    return text.replace(RadarAnalysisPolicy.URL_IN_TEXT, (url) =>
      RadarAnalysisPolicy.isBlockedUrl(url) ? RadarAnalysisPolicy.REMOVED_LINK : url
    );
  }

  /**
   * A fact check that cites no source is an opinion of the model, so it is never `major` (the
   * console warns on `major` only). Null stays null.
   */
  static severity(severity: RadarFactCheckSeverity | null, sourceCount: number): RadarFactCheckSeverity | null {
    return severity === 'major' && sourceCount === 0 ? 'minor' : severity;
  }
}
