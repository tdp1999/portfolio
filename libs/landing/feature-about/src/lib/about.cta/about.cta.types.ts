export type CtaItem = {
  readonly id: 'contact' | 'linkedin' | 'github' | 'cv';
  readonly labelEn: string;
  readonly labelVi: string;
  readonly href: string;
  readonly kind?: 'internal' | 'external' | 'download';
};
