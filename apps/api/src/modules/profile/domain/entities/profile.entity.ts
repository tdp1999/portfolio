import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';
import type {
  TranslatableJson,
  SocialLink,
  ResumeUrls,
  Certification,
  OpenToValue,
  SocialPlatform,
} from '@portfolio/shared/types';
import { IProfileProps, ICreateProfilePayload, Availability, WorkingHoursValue } from '../profile.types';
import {
  Identity,
  WorkAvailability,
  Contact,
  Location,
  SocialLinks,
  SeoOg,
  LandingContentBlocks,
} from '../value-objects';

interface ProfileAggregateProps {
  id: string;
  userId: string;
  identity: Identity;
  workAvailability: WorkAvailability;
  contact: Contact;
  location: Location;
  socialLinks: SocialLinks;
  seoOg: SeoOg;
  landingContent: LandingContentBlocks;
  /** Set by `markContentUpdated()` whenever the author saves narrative copy.
   *  Null on a freshly-created profile that hasn't been content-edited yet. */
  contentUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
}

export class Profile {
  private constructor(private readonly props: ProfileAggregateProps) {}

  // --- Section Getters ---

  get identity(): Identity {
    return this.props.identity;
  }

  get workAvailability(): WorkAvailability {
    return this.props.workAvailability;
  }

  get contact(): Contact {
    return this.props.contact;
  }

  get location(): Location {
    return this.props.location;
  }

  get socialLinksSection(): SocialLinks {
    return this.props.socialLinks;
  }

  get seoOg(): SeoOg {
    return this.props.seoOg;
  }

  get landingContent(): LandingContentBlocks {
    return this.props.landingContent;
  }

  // --- Flat Getters (backward compatibility for presenter/mapper) ---

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get fullName(): TranslatableJson {
    return this.props.identity.fullName;
  }

  get title(): TranslatableJson {
    return this.props.identity.title;
  }

  get bioShort(): TranslatableJson {
    return this.props.identity.bioShort;
  }

  get bioLong(): TranslatableJson | null {
    return this.props.identity.bioLong;
  }

  get avatarId(): string | null {
    return this.props.identity.avatarId;
  }

  get yearsOfExperience(): number {
    return this.props.workAvailability.yearsOfExperience;
  }

  get availability(): Availability {
    return this.props.workAvailability.availability;
  }

  get openTo(): OpenToValue[] {
    return this.props.workAvailability.openTo;
  }

  get timezones(): string[] {
    return this.props.workAvailability.timezones;
  }

  get workingHours(): WorkingHoursValue | null {
    return this.props.workAvailability.workingHours?.toJSON() ?? null;
  }

  get email(): string {
    return this.props.contact.email;
  }

  get phone(): string | null {
    return this.props.contact.phone;
  }

  get phoneZalo(): string | null {
    return this.props.contact.phoneZalo;
  }

  get preferredContactPlatform(): SocialPlatform {
    return this.props.contact.preferredContactPlatform;
  }

  get preferredContactValue(): string {
    return this.props.contact.preferredContactValue;
  }

  get locationCountry(): string {
    return this.props.location.country;
  }

  get locationCity(): string {
    return this.props.location.city;
  }

  get locationPostalCode(): string | null {
    return this.props.location.postalCode;
  }

  get locationAddress1(): string | null {
    return this.props.location.address1;
  }

  get locationAddress2(): string | null {
    return this.props.location.address2;
  }

  get socialLinks(): SocialLink[] {
    return this.props.socialLinks.socialLinks;
  }

  get resumeUrls(): ResumeUrls {
    return this.props.socialLinks.resumeUrls;
  }

  get certifications(): Certification[] {
    return this.props.socialLinks.certifications;
  }

  get metaTitle(): string | null {
    return this.props.seoOg.metaTitle;
  }

  get metaDescription(): string | null {
    return this.props.seoOg.metaDescription;
  }

  get ogImageId(): string | null {
    return this.props.seoOg.ogImageId;
  }

  get canonicalUrl(): string | null {
    return this.props.seoOg.canonicalUrl;
  }

  get tagline(): TranslatableJson | null {
    return this.props.landingContent.tagline;
  }

  get stackIntro(): TranslatableJson | null {
    return this.props.landingContent.stackIntro;
  }

  get selectedWorkIntro(): TranslatableJson | null {
    return this.props.landingContent.selectedWorkIntro;
  }

  get contactIntro(): TranslatableJson | null {
    return this.props.landingContent.contactIntro;
  }

  get footerTagline(): TranslatableJson | null {
    return this.props.landingContent.footerTagline;
  }

  get aboutHeading(): TranslatableJson | null {
    return this.props.landingContent.aboutHeading;
  }

  get aboutLede(): TranslatableJson | null {
    return this.props.landingContent.aboutLede;
  }

  get ctaHeading(): TranslatableJson | null {
    return this.props.landingContent.ctaHeading;
  }

  get ctaLede(): TranslatableJson | null {
    return this.props.landingContent.ctaLede;
  }

  get coreStack(): string[] {
    return this.props.landingContent.coreStack;
  }

  get contentUpdatedAt(): Date | null {
    return this.props.contentUpdatedAt;
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
    return this.props.workAvailability.isOpenToWork;
  }

  // --- Factory Methods ---

  static create(data: ICreateProfilePayload, userId: string): Profile {
    const now = TemporalValue.now();
    return new Profile({
      id: IdentifierValue.v7(),
      userId: data.userId,
      identity: Identity.create({
        fullName: data.fullName,
        title: data.title,
        bioShort: data.bioShort,
        bioLong: data.bioLong ?? null,
        avatarId: data.avatarId ?? null,
      }),
      workAvailability: WorkAvailability.create({
        yearsOfExperience: data.yearsOfExperience,
        availability: data.availability ?? 'EMPLOYED',
        openTo: data.openTo ?? [],
        timezones: data.timezones ?? [],
        workingHours: data.workingHours ?? null,
      }),
      contact: Contact.create({
        email: data.email,
        phone: data.phone ?? null,
        phoneZalo: data.phoneZalo ?? null,
        preferredContactPlatform: data.preferredContactPlatform ?? 'LINKEDIN',
        preferredContactValue: data.preferredContactValue,
      }),
      location: Location.create({
        country: data.locationCountry,
        city: data.locationCity,
        postalCode: data.locationPostalCode ?? null,
        address1: data.locationAddress1 ?? null,
        address2: data.locationAddress2 ?? null,
      }),
      socialLinks: SocialLinks.create({
        socialLinks: data.socialLinks ?? [],
        resumeUrls: data.resumeUrls ?? {},
        certifications: data.certifications ?? [],
      }),
      seoOg: SeoOg.create({
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        ogImageId: data.ogImageId ?? null,
        canonicalUrl: data.canonicalUrl ?? null,
      }),
      landingContent: LandingContentBlocks.create({
        tagline: data.tagline ?? null,
        stackIntro: data.stackIntro ?? null,
        selectedWorkIntro: data.selectedWorkIntro ?? null,
        contactIntro: data.contactIntro ?? null,
        footerTagline: data.footerTagline ?? null,
        aboutHeading: data.aboutHeading ?? null,
        aboutLede: data.aboutLede ?? null,
        ctaHeading: data.ctaHeading ?? null,
        ctaLede: data.ctaLede ?? null,
        coreStack: data.coreStack ?? [],
      }),
      contentUpdatedAt: null,
      createdAt: now,
      updatedAt: now,
      createdById: userId,
      updatedById: userId,
    });
  }

  static load(props: IProfileProps): Profile {
    return new Profile({
      id: props.id,
      userId: props.userId,
      identity: Identity.fromPersistence({
        fullName: props.fullName,
        title: props.title,
        bioShort: props.bioShort,
        bioLong: props.bioLong,
        avatarId: props.avatarId,
      }),
      workAvailability: WorkAvailability.fromPersistence({
        yearsOfExperience: props.yearsOfExperience,
        availability: props.availability,
        openTo: props.openTo,
        timezones: props.timezones,
        workingHours: props.workingHours,
      }),
      contact: Contact.fromPersistence({
        email: props.email,
        phone: props.phone,
        phoneZalo: props.phoneZalo,
        preferredContactPlatform: props.preferredContactPlatform,
        preferredContactValue: props.preferredContactValue,
      }),
      location: Location.fromPersistence({
        country: props.locationCountry,
        city: props.locationCity,
        postalCode: props.locationPostalCode,
        address1: props.locationAddress1,
        address2: props.locationAddress2,
      }),
      socialLinks: SocialLinks.fromPersistence({
        socialLinks: props.socialLinks,
        resumeUrls: props.resumeUrls,
        certifications: props.certifications,
      }),
      seoOg: SeoOg.fromPersistence({
        metaTitle: props.metaTitle,
        metaDescription: props.metaDescription,
        ogImageId: props.ogImageId,
        canonicalUrl: props.canonicalUrl,
      }),
      landingContent: LandingContentBlocks.fromPersistence({
        tagline: props.tagline,
        stackIntro: props.stackIntro,
        selectedWorkIntro: props.selectedWorkIntro,
        contactIntro: props.contactIntro,
        footerTagline: props.footerTagline,
        aboutHeading: props.aboutHeading,
        aboutLede: props.aboutLede,
        ctaHeading: props.ctaHeading,
        ctaLede: props.ctaLede,
        coreStack: props.coreStack ?? [],
      }),
      contentUpdatedAt: props.contentUpdatedAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      createdById: props.createdById,
      updatedById: props.updatedById,
    });
  }

  // --- Section Mutators (immutable) ---

  withIdentity(identity: Identity, userId: string): Profile {
    return new Profile({
      ...this.props,
      identity,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  withWorkAvailability(workAvailability: WorkAvailability, userId: string): Profile {
    return new Profile({
      ...this.props,
      workAvailability,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  withContact(contact: Contact, userId: string): Profile {
    return new Profile({
      ...this.props,
      contact,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  withLocation(location: Location, userId: string): Profile {
    return new Profile({
      ...this.props,
      location,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  withSocialLinks(socialLinks: SocialLinks, userId: string): Profile {
    return new Profile({
      ...this.props,
      socialLinks,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  withSeoOg(seoOg: SeoOg, userId: string): Profile {
    return new Profile({
      ...this.props,
      seoOg,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  withLandingContent(landingContent: LandingContentBlocks, userId: string): Profile {
    return new Profile({
      ...this.props,
      landingContent,
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    });
  }

  // --- Convenience Mutators (dedicated command flows) ---

  updateAvatar(avatarId: string | null, userId: string): Profile {
    const newIdentity = Identity.create({ ...this.props.identity.toProps(), avatarId });
    return this.withIdentity(newIdentity, userId);
  }

  updateOgImage(ogImageId: string | null, userId: string): Profile {
    const newSeoOg = SeoOg.create({ ...this.props.seoOg.toProps(), ogImageId });
    return this.withSeoOg(newSeoOg, userId);
  }

  /** Stamps `contentUpdatedAt` to "now". Called explicitly by the author from
   *  the console (separate from any per-save bump) so the /about hero "Last
   *  updated" line tracks narrative-edit cadence rather than every DB write. */
  markContentUpdated(userId: string): Profile {
    const now = TemporalValue.now();
    return new Profile({
      ...this.props,
      contentUpdatedAt: now,
      updatedAt: now,
      updatedById: userId,
    });
  }

  // --- Serialization ---

  toProps(): IProfileProps {
    return {
      id: this.props.id,
      userId: this.props.userId,
      fullName: this.props.identity.fullName,
      title: this.props.identity.title,
      bioShort: this.props.identity.bioShort,
      bioLong: this.props.identity.bioLong,
      avatarId: this.props.identity.avatarId,
      yearsOfExperience: this.props.workAvailability.yearsOfExperience,
      availability: this.props.workAvailability.availability,
      openTo: this.props.workAvailability.openTo,
      timezones: this.props.workAvailability.timezones,
      workingHours: this.props.workAvailability.workingHours?.toJSON() ?? null,
      email: this.props.contact.email,
      phone: this.props.contact.phone,
      phoneZalo: this.props.contact.phoneZalo,
      preferredContactPlatform: this.props.contact.preferredContactPlatform,
      preferredContactValue: this.props.contact.preferredContactValue,
      locationCountry: this.props.location.country,
      locationCity: this.props.location.city,
      locationPostalCode: this.props.location.postalCode,
      locationAddress1: this.props.location.address1,
      locationAddress2: this.props.location.address2,
      socialLinks: this.props.socialLinks.socialLinks,
      resumeUrls: this.props.socialLinks.resumeUrls,
      certifications: this.props.socialLinks.certifications,
      metaTitle: this.props.seoOg.metaTitle,
      metaDescription: this.props.seoOg.metaDescription,
      ogImageId: this.props.seoOg.ogImageId,
      canonicalUrl: this.props.seoOg.canonicalUrl,
      tagline: this.props.landingContent.tagline,
      stackIntro: this.props.landingContent.stackIntro,
      selectedWorkIntro: this.props.landingContent.selectedWorkIntro,
      contactIntro: this.props.landingContent.contactIntro,
      footerTagline: this.props.landingContent.footerTagline,
      aboutHeading: this.props.landingContent.aboutHeading,
      aboutLede: this.props.landingContent.aboutLede,
      ctaHeading: this.props.landingContent.ctaHeading,
      ctaLede: this.props.landingContent.ctaLede,
      coreStack: this.props.landingContent.coreStack,
      contentUpdatedAt: this.props.contentUpdatedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      createdById: this.props.createdById,
      updatedById: this.props.updatedById,
    };
  }
}
