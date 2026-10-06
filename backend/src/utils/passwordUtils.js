import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes plaintext password securely using bcryptjs with 10 salt rounds
 */
export const hashPassword = (password) => {
  return bcrypt.hashSync(password, SALT_ROUNDS);
};

/**
 * Verifies candidate password against stored bcrypt hash safely
 */
export const comparePassword = (candidatePassword, hashedPassword) => {
  if (!candidatePassword || !hashedPassword) return false;
  return bcrypt.compareSync(candidatePassword, hashedPassword);
};
