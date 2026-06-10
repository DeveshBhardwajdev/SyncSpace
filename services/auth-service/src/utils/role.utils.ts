import jwt from 'jsonwebtoken';
import { UserRole } from '../models/user.model';

// ─── Role Utilities ───────────────────────────────────────────────────

// Extracts the role from a JWT access token without going through middleware
// Useful in controllers or services that need to check role directly
export const getRoleFromToken = (token: string): UserRole | null => {
  try {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret) as { userId: string; role: UserRole };
    return decoded.role;

  } catch (error) {
    // If token is invalid or expired, return null instead of throwing
    return null;
  }
};

// Checks if a given role has access to a specific list of allowed roles
// Usage: hasPermission(UserRole.INTERVIEWER, [UserRole.INTERVIEWER, UserRole.ADMIN])
export const hasPermission = (
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean => {
  return allowedRoles.includes(userRole);
};