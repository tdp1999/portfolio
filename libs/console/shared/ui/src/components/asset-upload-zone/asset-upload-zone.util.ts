let nextId = 0;

export function getNextUploadId(): string {
  return `upload-${++nextId}`;
}
