// h2 rail at left:0 (border at margin-left:0). h3 at 16px. h4 at 32px.
// → rail visibly steps inward with depth.
export function indentForLevel(level: 2 | 3 | 4): number {
  return (level - 2) * 16;
}
