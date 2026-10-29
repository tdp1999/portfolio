import {
  BadRequestError,
  ConflictError,
  ErrorLayer,
  HealthProfileErrorCode,
  MedicalItemErrorCode,
  NotFoundError,
} from '@portfolio/shared/errors';
import { IHealthProfileRepository } from './ports/health-profile.repository.port';

export const PROFILE_GONE_MESSAGE = 'This person no longer exists';

export const medicalItemNotFound = () =>
  NotFoundError('Medical item not found', {
    errorCode: MedicalItemErrorCode.NOT_FOUND,
    layer: ErrorLayer.APPLICATION,
  });

export const healthProfileNotFound = () =>
  NotFoundError('Health profile not found', {
    errorCode: HealthProfileErrorCode.NOT_FOUND,
    layer: ErrorLayer.APPLICATION,
  });

/** 409 for a name another person not deleted already has, ignoring letter case (R11.2, R11.6). */
export const profileNameTaken = () =>
  ConflictError('A person with this name already exists', {
    errorCode: HealthProfileErrorCode.NAME_TAKEN,
    layer: ErrorLayer.APPLICATION,
  });

/** 400 at a field of the item form, so `ServerErrorDirective` shows the message under that input. */
export const medicalItemFieldError = (field: string, message: string) =>
  BadRequestError(
    message,
    { errorCode: MedicalItemErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION },
    { [field]: [message] }
  );

/** An item must belong to a person who still exists (R13.8, EP random `profileId`). */
export async function assertProfileExists(profiles: IHealthProfileRepository, profileId: string): Promise<void> {
  if (!(await profiles.findById(profileId))) throw medicalItemFieldError('profileId', PROFILE_GONE_MESSAGE);
}
