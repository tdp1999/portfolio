/**
 * Waits for a specified amount of time
 * Useful for testing async operations with timeouts
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a deferred promise that can be resolved/rejected externally
 * Useful for controlling async flow in tests
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Generates a random string ID for testing
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a date relative to now for testing
 */
export function createTestDate(daysOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

/**
 * Asserts that a function throws an error (sync or async)
 */
export async function expectToThrow(
  fn: () => unknown | Promise<unknown>,
  expectedMessage?: string | RegExp
): Promise<void> {
  let error: Error | null = null;

  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
  } catch (e) {
    error = e as Error;
  }

  if (!error) {
    throw new Error('Expected function to throw an error, but it did not');
  }

  if (expectedMessage) {
    if (typeof expectedMessage === 'string') {
      if (!error.message.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to include "${expectedMessage}", but got "${error.message}"`
        );
      }
    } else {
      if (!expectedMessage.test(error.message)) {
        throw new Error(
          `Expected error message to match ${expectedMessage}, but got "${error.message}"`
        );
      }
    }
  }
}
