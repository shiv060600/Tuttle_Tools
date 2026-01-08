import { Request, Response, NextFunction } from 'express';

// Type helper for session
interface SessionData {
  isAdmin?: boolean;
  userId?: string;
}

// Middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const session = (req as any).session as SessionData | undefined;
  console.log('XX Admin check - session exists:', !!session, 'isAdmin:', session?.isAdmin);
  if (session?.isAdmin) {
    next();
  } else {
    console.log('XX Admin access denied');
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Middleware to check if user is authenticated (optional for now)
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const session = (req as any).session as SessionData | undefined;
  if (session?.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

