/** Where the checklist files come from: the public plugin repo on prod, a local folder in dev. */
export interface IChecklistSource {
  /** The text of a file, by its path inside the checklist folder (`manifest.json`, `lanes/size-s.md`). Throws when it cannot be read. */
  read(path: string): Promise<string>;
}
