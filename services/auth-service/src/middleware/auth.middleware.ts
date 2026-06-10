import { Request, Response , NextFunction } from "express";
import  jwt from "jsonwebtoken";
import redis from "../config/redis";
import { UserRole } from '../models/user.model';


export const authGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ── Check 1: Is there a token in the Authorization header? ──────────
    // Expected format: "Bearer eyJhbGc..."
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    // Extract just the token part after "Bearer "
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
      return;
    }

    // ── Check 2: Is the token blacklisted in Redis? ──────────────────────
    // This catches tokens that were invalidated on logout
    // We check Redis BEFORE verifying the signature to fail fast
    const isBlacklisted = await redis.get(`blacklist:${token}`);

    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.',
      });
      return;
    }

    // ── Check 3: Is the token's signature valid and not expired? ─────────
    // jwt.verify throws if token is tampered with or expired
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret) as { userId: string; role: UserRole };

    // ── All checks passed — attach user info to request ──────────────────
    // Route handlers can now access req.user.userId and req.user.role
    req.user = {
      userId: decoded.userId,
      role: decoded.role as UserRole,
    };

    // Pass control to the next middleware or route handler
    next();

  } catch (error) {
    // jwt.verify throws JsonWebTokenError for invalid tokens
    // and TokenExpiredError for expired tokens
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired. Please refresh your session.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
      return;
    }

    console.error('Auth guard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};