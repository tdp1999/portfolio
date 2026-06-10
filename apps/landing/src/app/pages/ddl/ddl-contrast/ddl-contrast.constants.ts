import type { Role } from './ddl-contrast.types';

export const ROLE_FLOOR: Record<Role, { wcag: number; apca: number; label: string }> = {
  body: { wcag: 4.5, apca: 75, label: 'Body' },
  caption: { wcag: 4.5, apca: 60, label: 'Caption' },
  link: { wcag: 4.5, apca: 75, label: 'Link' },
  onAccent: { wcag: 4.5, apca: 75, label: 'On-accent' },
  focus: { wcag: 3.0, apca: 45, label: 'Focus / non-text' },
};

export const SURFACES: ReadonlyArray<{ token: string; label: string }> = [
  { token: '--landing-bg', label: 'bg' },
  { token: '--landing-surface', label: 'surface' },
  { token: '--landing-surface-elevated', label: 'elevated' },
];

export const TEXT_TOKENS: ReadonlyArray<{ token: string; label: string; role: Role }> = [
  { token: '--landing-text-300', label: 'text-300 · primary', role: 'body' },
  { token: '--landing-text-400', label: 'text-400 · secondary', role: 'body' },
  { token: '--landing-text-500', label: 'text-500 · muted', role: 'body' },
  { token: '--landing-text-600', label: 'text-600 · caption', role: 'caption' },
  { token: '--landing-accent', label: 'accent · link / icon', role: 'link' },
];
