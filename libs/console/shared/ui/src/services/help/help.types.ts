/** A feature guide (`<slug>` of `/guides/<slug>.html`) and an optional section id inside it. */
export interface GuideRef {
  guide: string;
  section?: string;
}
