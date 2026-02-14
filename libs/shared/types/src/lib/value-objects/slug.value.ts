export class SlugValue {
  static from(text: string): string {
    if (!text.trim()) {
      throw new Error('Cannot create slug from empty text');
    }

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
