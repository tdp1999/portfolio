import type { TranslatableJson } from '@portfolio/shared/types';

export interface LandingContentBlocksProps {
  tagline: TranslatableJson | null;
  stackIntro: TranslatableJson | null;
  selectedWorkIntro: TranslatableJson | null;
  contactIntro: TranslatableJson | null;
  footerTagline: TranslatableJson | null;
  /** /about page-shell hero heading — bilingual, plain text. */
  aboutHeading: TranslatableJson | null;
  /** /about page-shell hero lede paragraph — bilingual, plain text. */
  aboutLede: TranslatableJson | null;
  /** /about §04 Next steps heading — bilingual, plain text. */
  ctaHeading: TranslatableJson | null;
  /** /about §04 Next steps lede paragraph — bilingual, plain text. */
  ctaLede: TranslatableJson | null;
  coreStack: string[];
}

export class LandingContentBlocks {
  private constructor(private readonly props: LandingContentBlocksProps) {
    Object.freeze(this);
  }

  static create(props: LandingContentBlocksProps): LandingContentBlocks {
    return new LandingContentBlocks({ ...props, coreStack: [...(props.coreStack ?? [])] });
  }

  static fromPersistence(props: LandingContentBlocksProps): LandingContentBlocks {
    return new LandingContentBlocks({ ...props, coreStack: [...(props.coreStack ?? [])] });
  }

  static empty(): LandingContentBlocks {
    return new LandingContentBlocks({
      tagline: null,
      stackIntro: null,
      selectedWorkIntro: null,
      contactIntro: null,
      footerTagline: null,
      aboutHeading: null,
      aboutLede: null,
      ctaHeading: null,
      ctaLede: null,
      coreStack: [],
    });
  }

  get tagline(): TranslatableJson | null {
    return this.props.tagline;
  }

  get stackIntro(): TranslatableJson | null {
    return this.props.stackIntro;
  }

  get selectedWorkIntro(): TranslatableJson | null {
    return this.props.selectedWorkIntro;
  }

  get contactIntro(): TranslatableJson | null {
    return this.props.contactIntro;
  }

  get footerTagline(): TranslatableJson | null {
    return this.props.footerTagline;
  }

  get aboutHeading(): TranslatableJson | null {
    return this.props.aboutHeading;
  }

  get aboutLede(): TranslatableJson | null {
    return this.props.aboutLede;
  }

  get ctaHeading(): TranslatableJson | null {
    return this.props.ctaHeading;
  }

  get ctaLede(): TranslatableJson | null {
    return this.props.ctaLede;
  }

  get coreStack(): string[] {
    return [...this.props.coreStack];
  }

  equals(other: LandingContentBlocks): boolean {
    return (
      JSON.stringify(this.props.tagline) === JSON.stringify(other.props.tagline) &&
      JSON.stringify(this.props.stackIntro) === JSON.stringify(other.props.stackIntro) &&
      JSON.stringify(this.props.selectedWorkIntro) === JSON.stringify(other.props.selectedWorkIntro) &&
      JSON.stringify(this.props.contactIntro) === JSON.stringify(other.props.contactIntro) &&
      JSON.stringify(this.props.footerTagline) === JSON.stringify(other.props.footerTagline) &&
      JSON.stringify(this.props.aboutHeading) === JSON.stringify(other.props.aboutHeading) &&
      JSON.stringify(this.props.aboutLede) === JSON.stringify(other.props.aboutLede) &&
      JSON.stringify(this.props.ctaHeading) === JSON.stringify(other.props.ctaHeading) &&
      JSON.stringify(this.props.ctaLede) === JSON.stringify(other.props.ctaLede) &&
      JSON.stringify(this.props.coreStack) === JSON.stringify(other.props.coreStack)
    );
  }

  toProps(): LandingContentBlocksProps {
    return { ...this.props, coreStack: [...this.props.coreStack] };
  }
}
