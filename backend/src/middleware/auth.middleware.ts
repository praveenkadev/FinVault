import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/auth.service';
import { TokenPayload } from '../types';

// Extend Express Request
export interface AuthRequest extends Request {
  user: TokenPayload;
}

// ── JWT Auth middleware ───────────────────────────────────
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    (req as AuthRequest).user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── RBAC Role guard ───────────────────────────────────────
export const requireRole = (...roles: Array<'user' | 'admin'>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
