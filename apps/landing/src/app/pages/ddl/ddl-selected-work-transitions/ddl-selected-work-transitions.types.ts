export interface MockProject {
  readonly slug: string;
  readonly title: string;
  readonly year: string;
  readonly role: string;
  readonly description: string;
  readonly skills: readonly string[];
  readonly imageUrls: readonly string[];
}
