import bcrypt from 'bcrypt';

const MIN_COST = 10;

const resolveCost = (): number => {
  const raw = process.env.BCRYPT_SALT_ROUNDS;
  if (!raw) return MIN_COST;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < MIN_COST) return MIN_COST;
  return parsed;
};

// Precomputed bcrypt hash for timing-safe comparisons on invalid accounts.
export const DUMMY_PASSWORD_HASH =
  '$2b$10$YLyj7DuHyNMBsM0ORv4/I.7EimAtsvnruTe4hpcizmJS1WfAbf/ia';

export const hashPassword = async (password: string, cost: number = resolveCost()): Promise<string> => {
  return bcrypt.hash(password, cost);
};

export const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
  if (!passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
};
