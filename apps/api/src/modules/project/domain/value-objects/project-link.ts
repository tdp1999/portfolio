import { BadRequestError, ErrorLayer, ProjectErrorCode } from '@portfolio/shared/errors';

export const PROJECT_LINK_TYPES = ['repo', 'demo', 'case-study', 'doc', 'post'] as const;
export type ProjectLinkType = (typeof PROJECT_LINK_TYPES)[number];

export interface ProjectLinkProps {
  label: string;
  url: string;
  type: ProjectLinkType;
}

export class ProjectLink {
  private constructor(private readonly props: ProjectLinkProps) {
    Object.freeze(this);
  }

  static create(props: ProjectLinkProps): ProjectLink {
    const label = props.label?.trim();
    if (!label) {
      throw BadRequestError('ProjectLink.label is required', {
        errorCode: ProjectErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }

    if (!ProjectLink.isValidUrl(props.url)) {
      throw BadRequestError(`ProjectLink.url is not a valid URL: ${props.url}`, {
        errorCode: ProjectErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }

    if (!PROJECT_LINK_TYPES.includes(props.type)) {
      throw BadRequestError(`ProjectLink.type must be one of ${PROJECT_LINK_TYPES.join(', ')}`, {
        errorCode: ProjectErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new ProjectLink({ label, url: props.url, type: props.type });
  }

  static fromPersistence(props: ProjectLinkProps): ProjectLink {
    return new ProjectLink({ ...props });
  }

  private static isValidUrl(value: string): boolean {
    if (typeof value !== 'string' || value.length === 0) return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  get label(): string {
    return this.props.label;
  }

  get url(): string {
    return this.props.url;
  }

  get type(): ProjectLinkType {
    return this.props.type;
  }

  equals(other: ProjectLink): boolean {
    return (
      this.props.label === other.props.label &&
      this.props.url === other.props.url &&
      this.props.type === other.props.type
    );
  }

  toProps(): ProjectLinkProps {
    return { ...this.props };
  }
}
