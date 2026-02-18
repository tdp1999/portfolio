import { v7 as uuidv7, validate } from 'uuid';
import { BadRequestError, ErrorLayer } from '@portfolio/shared/errors';

export class IdentifierValue {
  static v7(): string {
    return uuidv7();
  }

  static from(id: string): string {
    if (!validate(id)) {
      throw BadRequestError(`Invalid UUID: ${id}`, { layer: ErrorLayer.DOMAIN });
    }
    return id;
  }
}
