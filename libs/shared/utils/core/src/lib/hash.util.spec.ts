import { hashPassword, comparePassword } from './hash.util';

describe('hashPassword', () => {
  it('should return a bcrypt hash', async () => {
    const hash = await hashPassword('myPassword');

    expect(hash).toMatch(/^\$2[aby]?\$/);
    expect(hash).not.toBe('myPassword');
  });
});

describe('comparePassword', () => {
  it('should return true for matching password', async () => {
    const hash = await hashPassword('myPassword');

    await expect(comparePassword('myPassword', hash)).resolves.toBe(true);
  });

  it('should return false for non-matching password', async () => {
    const hash = await hashPassword('myPassword');

    await expect(comparePassword('wrongPassword', hash)).resolves.toBe(false);
  });
});
