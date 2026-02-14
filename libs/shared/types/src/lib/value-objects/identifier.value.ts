import { v7 as uuidv7, validate } from 'uuid';

export class IdentifierValue {
  static v7(): string {
    return uuidv7();
  }

  static from(id: string): string {
    if (!validate(id)) {
      throw new Error(`Invalid UUID: ${id}`);
    }
    return id;
  }
}
