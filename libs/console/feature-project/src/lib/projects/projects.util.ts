let nextId = 0;

export function getNextId(): string {
  return `project-${++nextId}`;
}
