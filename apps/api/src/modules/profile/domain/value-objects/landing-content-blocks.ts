import type { TranslatableJson } from '@portfolio/shared/types';

export interface LandingContentBlocksProps {
  tagline: TranslatableJson | null;
  stackIntro: TranslatableJson | null;
  contactIntro: TranslatableJson | null;
  footerTagline: TranslatableJson | null;
}

export class LandingContentBlocks {
  private constructor(private readonly props: LandingContentBlocksProps) {
    Object.freeze(this);
  }

  static create(props: LandingContentBlocksProps): LandingContentBlocks {
    return new LandingContentBlocks({ ...props });
  }

  static fromPersistence(props: LandingContentBlocksProps): LandingContentBlocks {
    return new LandingContentBlocks({ ...props });
  }

  static empty(): LandingContentBlocks {
    return new LandingContentBlocks({
      tagline: null,
      stackIntro: null,
      contactIntro: null,
      footerTagline: null,
    });
  }

  get tagline(): TranslatableJson | null {
    return this.props.tagline;
  }

  get stackIntro(): TranslatableJson | null {
    return this.props.stackIntro;
  }

  get contactIntro(): TranslatableJson | null {
    return this.props.contactIntro;
  }

  get footerTagline(): TranslatableJson | null {
    return this.props.footerTagline;
  }

  equals(other: LandingContentBlocks): boolean {
    return (
      JSON.stringify(this.props.tagline) === JSON.stringify(other.props.tagline) &&
      JSON.stringify(this.props.stackIntro) === JSON.stringify(other.props.stackIntro) &&
      JSON.stringify(this.props.contactIntro) === JSON.stringify(other.props.contactIntro) &&
      JSON.stringify(this.props.footerTagline) === JSON.stringify(other.props.footerTagline)
    );
  }

  toProps(): LandingContentBlocksProps {
    return { ...this.props };
  }
}
