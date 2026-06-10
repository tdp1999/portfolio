let megaMenuSeq = 0;

export function nextMegaMenuId(): string {
  return (++megaMenuSeq).toString(36);
}
