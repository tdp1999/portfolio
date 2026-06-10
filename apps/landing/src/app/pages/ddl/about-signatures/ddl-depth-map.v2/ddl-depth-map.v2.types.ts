export type RingNode = {
  readonly id: string;
  readonly name: string;
  readonly iconUrl: string | null;
  readonly proficiencyNote: string | null;
  readonly x: number;
  readonly y: number;
  readonly anchor: 'start' | 'middle' | 'end';
};
