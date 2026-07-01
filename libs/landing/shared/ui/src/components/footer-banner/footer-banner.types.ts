export type FooterRoute = {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
};

export type FooterColumn = {
  readonly title: string;
  readonly routes: readonly FooterRoute[];
};
