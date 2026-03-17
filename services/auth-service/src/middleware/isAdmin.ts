import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener token de cookie o header
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Verificar que el usuario sea admin
    if (decoded.role !== 'admin') {
      logger.warn(`Non-admin user attempted to access admin route`, 'AUTH_MIDDLEWARE', {
        userId: decoded.id,
        role: decoded.role
      });
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Agregar usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error: any) {
    logger.error(`Admin auth error: ${error.message}`, 'AUTH_MIDDLEWARE');
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    return res.status(500).json({ message: 'Server error' });
  }
};
