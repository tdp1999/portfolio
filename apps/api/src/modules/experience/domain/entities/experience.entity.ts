import {
  BaseCrudEntity,
  ExperienceLink,
  SlugValue,
  TranslatableJson,
  TranslatableRichText,
} from '@portfolio/shared/types';
import {
  IExperienceProps,
  ICreateExperiencePayload,
  IUpdateExperiencePayload,
  EmploymentType,
  LocationType,
} from '../experience.types';

export class Experience extends BaseCrudEntity<IExperienceProps> {
  private constructor(props: IExperienceProps) {
    super(props);
  }

  get slug(): string {
    return this.props.slug;
  }

  get companyName(): string {
    return this.props.companyName;
  }

  get companyUrl(): string | null {
    return this.props.companyUrl;
  }

  get companyLogoId(): string | null {
    return this.props.companyLogoId;
  }

  get position() {
    return this.props.position;
  }

  get teamRole() {
    return this.props.teamRole;
  }

  get descriptionJson(): TranslatableRichText | null {
    return this.props.descriptionJson;
  }

  get descriptionHtml(): TranslatableJson | null {
    return this.props.descriptionHtml;
  }

  get descriptionCanonical(): TranslatableJson | null {
    return this.props.descriptionCanonical;
  }

  get descriptionSchemaVersion(): number {
    return this.props.descriptionSchemaVersion;
  }

  get responsibilitiesJson(): TranslatableRichText | null {
    return this.props.responsibilitiesJson;
  }

  get responsibilitiesHtml(): TranslatableJson | null {
    return this.props.responsibilitiesHtml;
  }

  get responsibilitiesCanonical(): TranslatableJson | null {
    return this.props.responsibilitiesCanonical;
  }

  get responsibilitiesSchemaVersion(): number {
    return this.props.responsibilitiesSchemaVersion;
  }

  get highlightsJson(): TranslatableRichText | null {
    return this.props.highlightsJson;
  }

  get highlightsHtml(): TranslatableJson | null {
    return this.props.highlightsHtml;
  }

  get highlightsCanonical(): TranslatableJson | null {
    return this.props.highlightsCanonical;
  }

  get highlightsSchemaVersion(): number {
    return this.props.highlightsSchemaVersion;
  }

  get links(): ExperienceLink[] {
    return this.props.links;
  }

  get employmentType(): EmploymentType {
    return this.props.employmentType;
  }

  get locationType(): LocationType {
    return this.props.locationType;
  }

  get locationCountry(): string {
    return this.props.locationCountry;
  }

  get locationCity(): string | null {
    return this.props.locationCity;
  }

  get locationPostalCode(): string | null {
    return this.props.locationPostalCode;
  }

  get locationAddress1(): string | null {
    return this.props.locationAddress1;
  }

  get locationAddress2(): string | null {
    return this.props.locationAddress2;
  }

  get clientName(): string | null {
    return this.props.clientName;
  }

  get domain(): string | null {
    return this.props.domain;
  }

  get teamSizeMin(): number | null {
    return this.props.teamSizeMin;
  }

  get teamSizeMax(): number | null {
    return this.props.teamSizeMax;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | null {
    return this.props.endDate;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get skillIds(): string[] {
    return this.props.skillIds;
  }

  get isCurrent(): boolean {
    return this.props.endDate === null;
  }

  static create(data: ICreateExperiencePayload, userId: string): Experience {
    const slug = SlugValue.from(`${data.companyName} ${data.position.en}`);

    return new Experience({
      ...BaseCrudEntity.createBaseProps(userId),
      slug,
      companyName: data.companyName,
      companyUrl: data.companyUrl ?? null,
      companyLogoId: data.companyLogoId ?? null,
      position: data.position,
      teamRole: data.teamRole ?? null,
      // Rich-text columns default empty; the RTE write path fills them on save.
      descriptionJson: null,
      descriptionHtml: null,
      descriptionSchemaVersion: 1,
      descriptionCanonical: null,
      responsibilitiesJson: null,
      responsibilitiesHtml: null,
      responsibilitiesSchemaVersion: 1,
      responsibilitiesCanonical: null,
      highlightsJson: null,
      highlightsHtml: null,
      highlightsSchemaVersion: 1,
      highlightsCanonical: null,
      links: data.links ?? [],
      employmentType: data.employmentType ?? 'FULL_TIME',
      locationType: data.locationType ?? 'ONSITE',
      locationCountry: data.locationCountry,
      locationCity: data.locationCity ?? null,
      locationPostalCode: data.locationPostalCode ?? null,
      locationAddress1: data.locationAddress1 ?? null,
      locationAddress2: data.locationAddress2 ?? null,
      clientName: data.clientName ?? null,
      domain: data.domain ?? null,
      teamSizeMin: data.teamSizeMin ?? null,
      teamSizeMax: data.teamSizeMax ?? null,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      displayOrder: data.displayOrder ?? 0,
      skillIds: [],
    });
  }

  static load(props: IExperienceProps): Experience {
    return new Experience(props);
  }

  update(data: IUpdateExperiencePayload, userId: string): Experience {
    return new Experience({
      ...this.props,
      // slug is intentionally NOT regenerated (EXP-001: slug is immutable after creation)
      companyName: data.companyName ?? this.props.companyName,
      companyUrl: data.companyUrl !== undefined ? data.companyUrl : this.props.companyUrl,
      companyLogoId: data.companyLogoId !== undefined ? data.companyLogoId : this.props.companyLogoId,
      position: data.position ?? this.props.position,
      teamRole: data.teamRole !== undefined ? data.teamRole : this.props.teamRole,
      links: data.links ?? this.props.links,
      employmentType: data.employmentType ?? this.props.employmentType,
      locationType: data.locationType ?? this.props.locationType,
      locationCountry: data.locationCountry ?? this.props.locationCountry,
      locationCity: data.locationCity !== undefined ? data.locationCity : this.props.locationCity,
      locationPostalCode:
        data.locationPostalCode !== undefined ? data.locationPostalCode : this.props.locationPostalCode,
      locationAddress1: data.locationAddress1 !== undefined ? data.locationAddress1 : this.props.locationAddress1,
      locationAddress2: data.locationAddress2 !== undefined ? data.locationAddress2 : this.props.locationAddress2,
      clientName: data.clientName !== undefined ? data.clientName : this.props.clientName,
      domain: data.domain !== undefined ? data.domain : this.props.domain,
      teamSizeMin: data.teamSizeMin !== undefined ? data.teamSizeMin : this.props.teamSizeMin,
      teamSizeMax: data.teamSizeMax !== undefined ? data.teamSizeMax : this.props.teamSizeMax,
      startDate: data.startDate ?? this.props.startDate,
      endDate: data.endDate !== undefined ? data.endDate : this.props.endDate,
      displayOrder: data.displayOrder ?? this.props.displayOrder,
      skillIds: this.props.skillIds,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  /** Set the `description` rich-text triple atomically (RTE write path). */
  withDescriptionRichText(
    rich: { json: TranslatableRichText; canonical: TranslatableJson; html: TranslatableJson; schemaVersion: number },
    userId: string
  ): Experience {
    return new Experience({
      ...this.props,
      descriptionJson: rich.json,
      descriptionHtml: rich.html,
      descriptionSchemaVersion: rich.schemaVersion,
      descriptionCanonical: rich.canonical,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  /** Set the `responsibilities` rich-text triple atomically (RTE write path). */
  withResponsibilitiesRichText(
    rich: { json: TranslatableRichText; canonical: TranslatableJson; html: TranslatableJson; schemaVersion: number },
    userId: string
  ): Experience {
    return new Experience({
      ...this.props,
      responsibilitiesJson: rich.json,
      responsibilitiesHtml: rich.html,
      responsibilitiesSchemaVersion: rich.schemaVersion,
      responsibilitiesCanonical: rich.canonical,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  /** Set the `highlights` rich-text triple atomically (RTE write path). */
  withHighlightsRichText(
    rich: { json: TranslatableRichText; canonical: TranslatableJson; html: TranslatableJson; schemaVersion: number },
    userId: string
  ): Experience {
    return new Experience({
      ...this.props,
      highlightsJson: rich.json,
      highlightsHtml: rich.html,
      highlightsSchemaVersion: rich.schemaVersion,
      highlightsCanonical: rich.canonical,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  softDelete(userId: string): Experience {
    return new Experience({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  restore(userId: string): Experience {
    return new Experience({
      ...this.props,
      deletedAt: null,
      deletedById: null,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): IExperienceProps {
    return { ...this.props };
  }
}
