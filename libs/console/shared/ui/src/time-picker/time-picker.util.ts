export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function fromMinutes(total: number): string {
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function format12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(m)} ${period}`;
}
