import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

/**
 * Middleware that validates any JWT — does NOT require admin/specific role.
 * Populates req.user with { id, email, role }.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.token ||
      req.cookies?.auth_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    logger.warn(`Invalid token on /me: ${error.message}`, 'AUTHENTICATE');
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};
