import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// This tells TypeScript that req.user can exist and what shape it has
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authGuard = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. Get the Authorization header, which looks like: "Bearer eyJhbGciOiJIUzI1NiIs..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  // 2. Extract just the token part (remove "Bearer ")
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify the token's signature using the SAME secret auth-service used to sign it
    const secret = process.env.JWT_ACCESS_SECRET?.trim();

    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET is not set");
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      role: string;
    };

    // 4. Attach the decoded info to the request so controllers can use it
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // 5. Let the request continue to the actual route handler
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};