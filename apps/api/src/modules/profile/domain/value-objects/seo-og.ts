export interface SeoOgProps {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageId: string | null;
  canonicalUrl: string | null;
}

export class SeoOg {
  private constructor(private readonly props: SeoOgProps) {
    Object.freeze(this);
  }

  static create(props: SeoOgProps): SeoOg {
    return new SeoOg({ ...props });
  }

  static fromPersistence(props: SeoOgProps): SeoOg {
    return new SeoOg({ ...props });
  }

  get metaTitle(): string | null {
    return this.props.metaTitle;
  }

  get metaDescription(): string | null {
    return this.props.metaDescription;
  }

  get ogImageId(): string | null {
    return this.props.ogImageId;
  }

  get canonicalUrl(): string | null {
    return this.props.canonicalUrl;
  }

  equals(other: SeoOg): boolean {
    return (
      this.props.metaTitle === other.props.metaTitle &&
      this.props.metaDescription === other.props.metaDescription &&
      this.props.ogImageId === other.props.ogImageId &&
      this.props.canonicalUrl === other.props.canonicalUrl
    );
  }

  toProps(): SeoOgProps {
    return { ...this.props };
  }
}
