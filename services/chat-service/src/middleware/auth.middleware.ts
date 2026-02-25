import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  body: any;
  params: any;
  query: any;
  cookies: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Obtener token de cookie o header
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    logger.error('Token verification failed', 'AUTH_MIDDLEWARE', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Verificar token de WebSocket
export const verifySocketToken = (token: string): { id: string; email: string; role?: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    return {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    logger.error('Socket token verification failed', 'SOCKET_AUTH', error);
    return null;
  }
};
