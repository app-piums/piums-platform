import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { resolveArtistId } from '../utils/artist-resolver';

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

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Obtener token de cookie o header
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-only-secret-not-for-production') as any;
    let userId = decoded.id || decoded.userId;

    if (decoded.role === 'artista' || decoded.role === 'artist') {
      const profileId = await resolveArtistId(token);
      if (profileId) {
        userId = profileId;
      }
    }

    req.user = {
      id: userId,
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
export const verifySocketToken = async (token: string): Promise<{ id: string; email: string; role?: string } | null> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-only-secret-not-for-production') as any;
    let userId = decoded.id || decoded.userId;

    if (decoded.role === 'artista' || decoded.role === 'artist') {
      const profileId = await resolveArtistId(token);
      if (profileId) {
        userId = profileId;
      }
    }

    return {
      id: userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    logger.error('Socket token verification failed', 'SOCKET_AUTH', error);
    return null;
  }
};
