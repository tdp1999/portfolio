export interface IconProvider {
  getSvg(name: string, size: number): string | null;
  getSupportedIcons(): string[];
}
