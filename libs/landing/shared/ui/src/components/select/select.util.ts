let selectSeq = 0;

export function nextSelectId(): string {
  return (++selectSeq).toString(36);
}
