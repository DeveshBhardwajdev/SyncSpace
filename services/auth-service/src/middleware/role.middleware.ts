import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';

// ─── Role Guard Middleware ─────────────────────────────────────────────
//
// This is a "middleware factory" — a function that RETURNS a middleware function.
// That's why it looks like a function inside a function.
//
// Usage on a route:
//   router.get('/interviewer-only', authGuard, requireRole(UserRole.INTERVIEWER), handler)
//
// You can allow multiple roles at once:
//   router.get('/shared-route', authGuard, requireRole(UserRole.INTERVIEWER, UserRole.CANDIDATE), handler)

export const requireRole = (...allowedRoles: UserRole[]) => {
  // This is the actual middleware function Express will call
  return (req: Request, res: Response, next: NextFunction): void => {

    // req.user is set by the Auth Guard middleware that runs before this
    // If somehow this middleware runs without Auth Guard, catch it defensively
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No user found on request.',
      });
      return;
    }

    const userObj = req.user as unknown as { userId: string; role: UserRole };
    const userRole = userObj.role;

    // Check if the user's role is in the list of allowed roles
    const isAllowed = allowedRoles.includes(userRole);

    if (!isAllowed) {
      // 403 Forbidden — we know who you are, you just can't come in
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}.`,
      });
      return;
    }

    // Role is valid — pass control to the next middleware or route handler
    next();
  };
};