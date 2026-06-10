let uid = 0;

export function nextUid(): string {
  return `show-more-${uid++}`;
}
