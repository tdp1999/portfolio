import { IChecklistSource } from '../../application/ports/checklist-source.port';

/** Reads the checklist folder of the public plugin repo over its raw URL. No token: the repo is public. */
export class ChecklistHttpSource implements IChecklistSource {
  private static readonly TIMEOUT_MS = 10_000;
  /** Far above any lane: a wrong URL that serves a large file fails here, not in the parser. */
  private static readonly MAX_CHARS = 200_000;

  constructor(private readonly baseUrl: string) {}

  async read(path: string): Promise<string> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/${path}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(ChecklistHttpSource.TIMEOUT_MS) });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const text = await response.text();
    if (text.length > ChecklistHttpSource.MAX_CHARS) throw new Error(`${url}: too large (${text.length} characters)`);
    return text;
  }
}
