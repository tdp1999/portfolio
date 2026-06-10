export interface BreadcrumbItem {
  readonly label: string;
  /** Omit on the trailing item to mark it as the current page (rendered as plain text). */
  readonly href?: string;
}
