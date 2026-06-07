/* eslint-disable @typescript-eslint/no-var-requires */
import { env } from '../../config/env';

const SALT_ROUNDS = Number(env.BCRYPT_SALT_ROUNDS);

type BcryptModule = {
  hash: (plainPassword: string, saltRounds: number) => Promise<string>;
  compare: (
    plainPassword: string,
    hashedPassword: string,
  ) => Promise<boolean>;
};

const loadBcrypt = (): BcryptModule => {
  return require('bcrypt') as BcryptModule;
};

export const hashPassword = async (plainPassword: string): Promise<string> => {
  return await loadBcrypt().hash(plainPassword, SALT_ROUNDS);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await loadBcrypt().compare(plainPassword, hashedPassword);
};
