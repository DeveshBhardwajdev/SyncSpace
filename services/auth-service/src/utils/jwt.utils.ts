import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRole } from '../models/user.model';

// ─── Password Utilities ────────────────────────────────────────────────

export const hashPassword = async (plainTextPassword: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(plainTextPassword, saltRounds);
};

export const comparePassword = async (
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

// ─── JWT Token Utilities ───────────────────────────────────────────────

export const generateAccessToken = (userId: string, role: UserRole): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
  }

  // Read the expiry value and strip any whitespace just in case
  const expiry = (process.env.JWT_ACCESS_EXPIRY || '15m').trim();

  const options: SignOptions = {
    expiresIn: expiry as SignOptions['expiresIn'],
  };

  return jwt.sign({ userId, role }, secret, options);
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  // Read the expiry value and strip any whitespace just in case
  const expiry = (process.env.JWT_REFRESH_EXPIRY || '7d').trim();

  const options: SignOptions = {
    expiresIn: expiry as SignOptions['expiresIn'],
  };

  return jwt.sign({ userId }, secret, options);
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }

  // jwt.verify throws an error if the token is invalid or expired
  // We cast the result to tell TypeScript what shape the payload is
  return jwt.verify(token, secret) as { userId: string };
};