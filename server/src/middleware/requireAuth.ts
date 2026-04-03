import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    console.log('[requireAuth] Missing or malformed Authorization header');
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET || 'changeme') as {
      userId: string;
      username: string;
    };
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch (err) {
    const e = err as { name?: string; message?: string; expiredAt?: Date };
    console.log('[requireAuth] JWT verification failed');
    console.log('  reason :', e.name, '-', e.message);
    console.log('  secret :', JWT_SECRET ? `loaded from env (${JWT_SECRET.slice(0, 4)}…)` : 'using fallback "changeme"');
    if (e.expiredAt) console.log('  expired:', e.expiredAt.toISOString());
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};