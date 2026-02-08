import { wait, createDeferred, generateTestId, createTestDate, expectToThrow } from './test-utils';

describe('wait', () => {
  it('should resolve after specified time', async () => {
    const start = Date.now();
    await wait(50);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small variance
  });
});

describe('createDeferred', () => {
  it('should create a promise that can be resolved externally', async () => {
    const { promise, resolve } = createDeferred<string>();

    setTimeout(() => resolve('test-value'), 10);

    const result = await promise;
    expect(result).toBe('test-value');
  });

  it('should create a promise that can be rejected externally', async () => {
    const { promise, reject } = createDeferred<string>();

    setTimeout(() => reject(new Error('test-error')), 10);

    await expect(promise).rejects.toThrow('test-error');
  });
});

describe('generateTestId', () => {
  it('should generate unique ids with default prefix', () => {
    const id1 = generateTestId();
    const id2 = generateTestId();

    expect(id1).toMatch(/^test-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should use custom prefix', () => {
    const id = generateTestId('custom');

    expect(id).toMatch(/^custom-[a-z0-9]+$/);
  });
});

describe('createTestDate', () => {
  it('should create a date in the future', () => {
    const today = new Date();
    const futureDate = createTestDate(7);

    expect(futureDate.getTime()).toBeGreaterThan(today.getTime());
  });

  it('should create a date in the past', () => {
    const today = new Date();
    const pastDate = createTestDate(-7);

    expect(pastDate.getTime()).toBeLessThan(today.getTime());
  });
});

describe('expectToThrow', () => {
  it('should pass when sync function throws', async () => {
    await expectToThrow(() => {
      throw new Error('expected error');
    });
  });

  it('should pass when async function throws', async () => {
    await expectToThrow(async () => {
      throw new Error('async error');
    });
  });

  it('should fail when function does not throw', async () => {
    try {
      await expectToThrow(() => 'no error');
      fail('Should have thrown');
    } catch (e) {
      expect((e as Error).message).toContain('Expected function to throw');
    }
  });

  it('should check error message with string', async () => {
    await expectToThrow(() => {
      throw new Error('specific error message');
    }, 'specific');
  });

  it('should check error message with regex', async () => {
    await expectToThrow(() => {
      throw new Error('error code: 123');
    }, /code: \d+/);
  });
});
