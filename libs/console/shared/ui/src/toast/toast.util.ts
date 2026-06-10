let nextId = 0;

export function getNextToastId(): string {
  return `toast-${++nextId}`;
}
