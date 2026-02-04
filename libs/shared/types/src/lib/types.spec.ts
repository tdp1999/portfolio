import { BaseEntity } from './types';

describe('BaseEntity', () => {
  it('should define the correct structure', () => {
    const entity: BaseEntity = {
      id: '123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(entity.id).toBe('123');
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });
});
