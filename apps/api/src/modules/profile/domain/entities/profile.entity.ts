import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';
import type { OpenToValue } from '@portfolio/shared/types';
import { IProfileProps, ICreateProfilePayload, IUpdateProfilePayload, Availability } from '../profile.types';

export class Profile {
  private constructor(private readonly props: IProfileProps) {}

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get fullName() {
    return this.props.fullName;
  }

  get title() {
    return this.props.title;
  }

  get bioShort() {
    return this.props.bioShort;
  }

  get bioLong() {
    return this.props.bioLong;
  }

  get yearsOfExperience(): number {
    return this.props.yearsOfExperience;
  }

  get availability(): Availability {
    return this.props.availability;
  }

  get openTo(): OpenToValue[] {
    return this.props.openTo;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get preferredContactPlatform() {
    return this.props.preferredContactPlatform;
  }

  get preferredContactValue(): string {
    return this.props.preferredContactValue;
  }

  get locationCountry(): string {
    return this.props.locationCountry;
  }

  get locationCity(): string {
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

  get socialLinks() {
    return this.props.socialLinks;
  }

  get resumeUrls() {
    return this.props.resumeUrls;
  }

  get certifications() {
    return this.props.certifications;
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

  get timezone(): string | null {
    return this.props.timezone;
  }

  get canonicalUrl(): string | null {
    return this.props.canonicalUrl;
  }

  get avatarId(): string | null {
    return this.props.avatarId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdById(): string {
    return this.props.createdById;
  }

  get updatedById(): string {
    return this.props.updatedById;
  }

  get isOpenToWork(): boolean {
    return (
      this.props.availability === 'OPEN_TO_WORK' ||
      (this.props.availability === 'EMPLOYED' && this.props.openTo.length > 0)
    );
  }

  // --- Factory Methods ---

  static create(data: ICreateProfilePayload, userId: string): Profile {
    const now = TemporalValue.now();
    return new Profile({
      id: IdentifierValue.v7(),
      userId: data.userId,
      fullName: data.fullName,
      title: data.title,
      bioShort: data.bioShort,
      bioLong: data.bioLong ?? null,
      yearsOfExperience: data.yearsOfExperience,
      availability: data.availability ?? 'EMPLOYED',
      openTo: data.openTo ?? [],
      email: data.email,
      phone: data.phone ?? null,
      preferredContactPlatform: data.preferredContactPlatform ?? 'LINKEDIN',
      preferredContactValue: data.preferredContactValue,
      locationCountry: data.locationCountry,
      locationCity: data.locationCity,
      locationPostalCode: data.locationPostalCode ?? null,
      locationAddress1: data.locationAddress1 ?? null,
      locationAddress2: data.locationAddress2 ?? null,
      socialLinks: data.socialLinks ?? [],
      resumeUrls: data.resumeUrls ?? {},
      certifications: data.certifications ?? [],
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      ogImageId: data.ogImageId ?? null,
      timezone: data.timezone ?? null,
      canonicalUrl: data.canonicalUrl ?? null,
      avatarId: data.avatarId ?? null,
      createdAt: now,
      updatedAt: now,
      createdById: userId,
      updatedById: userId,
    });
  }

  static load(props: IProfileProps): Profile {
    return new Profile(props);
  }

  // --- Mutation Methods ---

  update(data: IUpdateProfilePayload, userId: string): Profile {
    return new Profile({
      ...this.props,
      fullName: data.fullName ?? this.props.fullName,
      title: data.title ?? this.props.title,
      bioShort: data.bioShort ?? this.props.bioShort,
      bioLong: data.bioLong !== undefined ? data.bioLong : this.props.bioLong,
      yearsOfExperience: data.yearsOfExperience ?? this.props.yearsOfExperience,
      availability: data.availability ?? this.props.availability,
      openTo: data.openTo ?? this.props.openTo,
      email: data.email ?? this.props.email,
      phone: data.phone !== undefined ? data.phone : this.props.phone,
      preferredContactPlatform: data.preferredContactPlatform ?? this.props.preferredContactPlatform,
      preferredContactValue: data.preferredContactValue ?? this.props.preferredContactValue,
      locationCountry: data.locationCountry ?? this.props.locationCountry,
      locationCity: data.locationCity ?? this.props.locationCity,
      locationPostalCode:
        data.locationPostalCode !== undefined ? data.locationPostalCode : this.props.locationPostalCode,
      locationAddress1: data.locationAddress1 !== undefined ? data.locationAddress1 : this.props.locationAddress1,
      locationAddress2: data.locationAddress2 !== undefined ? data.locationAddress2 : this.props.locationAddress2,
      socialLinks: data.socialLinks ?? this.props.socialLinks,
      resumeUrls: data.resumeUrls ?? this.props.resumeUrls,
      certifications: data.certifications ?? this.props.certifications,
      metaTitle: data.metaTitle !== undefined ? data.metaTitle : this.props.metaTitle,
      metaDescription: data.metaDescription !== undefined ? data.metaDescription : this.props.metaDescription,
      ogImageId: data.ogImageId !== undefined ? data.ogImageId : this.props.ogImageId,
      timezone: data.timezone !== undefined ? data.timezone : this.props.timezone,
      canonicalUrl: data.canonicalUrl !== undefined ? data.canonicalUrl : this.props.canonicalUrl,
      avatarId: data.avatarId !== undefined ? data.avatarId : this.props.avatarId,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  updateAvatar(avatarId: string | null, userId: string): Profile {
    return new Profile({
      ...this.props,
      avatarId,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  updateOgImage(ogImageId: string | null, userId: string): Profile {
    return new Profile({
      ...this.props,
      ogImageId,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  toProps(): IProfileProps {
    return { ...this.props };
  }
}
