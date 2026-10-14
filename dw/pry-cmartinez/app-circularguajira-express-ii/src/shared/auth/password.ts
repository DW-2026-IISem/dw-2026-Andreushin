import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

/**
 * Password and opaque-token hashing. Centralized because the User model hooks, the users
 * service and the login must all use the same parameters.
 *
 * bcrypt cost 12: deliberate CPU cost against brute force if a hash ever leaks.
 */
const SALT_ROUNDS = 12;

export const hashPassword = (plain: string): Promise<string> => hash(plain, SALT_ROUNDS);

export const verifyPassword = (plain: string, passwordHash: string): Promise<boolean> =>
  compare(plain, passwordHash);

/**
 * Deterministic SHA-256 (hex) for high-entropy credentials (refresh tokens). A random
 * 64-byte token is not guessable, so a slow algorithm is unnecessary; storing only the hash
 * keeps the plain value out of the database and allows a unique-index lookup.
 */
export const sha256Hex = (value: string): string => createHash("sha256").update(value).digest("hex");

// Opaque, URL-safe, non-guessable token (64 random bytes, about 86 characters).
export const generateOpaqueToken = (): string => randomBytes(64).toString("base64url");
