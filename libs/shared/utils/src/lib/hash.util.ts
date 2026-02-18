import { hash, compare } from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 10;

export const hashPassword = async (
  password: string,
  saltRounds = DEFAULT_SALT_ROUNDS
): Promise<string> => {
  return hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return compare(password, hashedPassword);
};
