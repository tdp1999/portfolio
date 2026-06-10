export type DdlSubrouteGroupId = 'compositions' | 'blocks' | 'patterns' | 'legacy';

export type DdlSubroute = {
  readonly path: string;
  readonly title: string;
  readonly desc: string;
};

export type DdlSubrouteGroup = {
  readonly id: DdlSubrouteGroupId;
  readonly label: string;
  readonly tone: 'accent' | 'muted';
  readonly routes: readonly DdlSubroute[];
};
