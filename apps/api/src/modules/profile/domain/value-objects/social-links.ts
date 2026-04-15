import { BadRequestError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import type { SocialLink, ResumeUrls, Certification } from '@portfolio/shared/types';

export interface SocialLinksProps {
  socialLinks: SocialLink[];
  resumeUrls: ResumeUrls;
  certifications: Certification[];
}

export class SocialLinks {
  private constructor(private readonly props: SocialLinksProps) {
    Object.freeze(this);
  }

  static create(props: SocialLinksProps): SocialLinks {
    for (const link of props.socialLinks) {
      if (!link.url?.trim()) {
        throw BadRequestError(`Social link for ${link.platform} must have a url`, {
          errorCode: ProfileErrorCode.INVALID_INPUT,
          layer: ErrorLayer.DOMAIN,
        });
      }
    }
    return new SocialLinks({ ...props });
  }

  static fromPersistence(props: SocialLinksProps): SocialLinks {
    return new SocialLinks({ ...props });
  }

  get socialLinks(): SocialLink[] {
    return this.props.socialLinks;
  }

  get resumeUrls(): ResumeUrls {
    return this.props.resumeUrls;
  }

  get certifications(): Certification[] {
    return this.props.certifications;
  }

  equals(other: SocialLinks): boolean {
    return (
      JSON.stringify(this.props.socialLinks) === JSON.stringify(other.props.socialLinks) &&
      JSON.stringify(this.props.resumeUrls) === JSON.stringify(other.props.resumeUrls) &&
      JSON.stringify(this.props.certifications) === JSON.stringify(other.props.certifications)
    );
  }

  toProps(): SocialLinksProps {
    return { ...this.props };
  }
}
