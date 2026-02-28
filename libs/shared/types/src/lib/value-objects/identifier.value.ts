import { v7 as uuidv7, validate } from 'uuid';
import { BadRequestError, ErrorLayer, CommonErrorCode } from '@portfolio/shared/errors';

export class IdentifierValue {
  static v7(): string {
    return uuidv7();
  }

  static from(id: string): string {
    if (!validate(id)) {
      throw BadRequestError(`Invalid UUID: ${id}`, {
        errorCode: CommonErrorCode.VALIDATION_ERROR,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return id;
  }
}
