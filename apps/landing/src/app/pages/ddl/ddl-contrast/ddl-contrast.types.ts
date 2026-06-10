export type Role = 'body' | 'caption' | 'link' | 'onAccent' | 'focus';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Cell {
  surface: string;
  hex: string;
  wcag: number;
  apca: number;
  passWcag: boolean;
  passApca: boolean;
}

export interface TextRow {
  token: string;
  label: string;
  role: Role;
  hex: string;
  cells: Cell[];
}

export interface RampStep {
  token: string;
  label: string;
  hex: string;
  apca: number;
}

export interface SurfaceLayer {
  token: string;
  label: string;
  hex: string;
  /** WCAG ratio vs the previous (lower) layer — must read as a distinct step. */
  vsPrev: number | null;
}

export interface OnAccentRow {
  label: string;
  fillToken: string;
  fillHex: string;
  wcag: number;
  apca: number;
  passWcag: boolean;
  passApca: boolean;
}
