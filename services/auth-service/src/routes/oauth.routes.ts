import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const router = Router();

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`
  }),
  (req, res) => {
    try {
      const user = req.user as any;

      // Generar JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.info('User authenticated via Google', 'OAUTH', { userId: user.id });

      // Redirect al frontend con el token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=google`);
    } catch (error: any) {
      logger.error(`Google callback error: ${error.message}`, 'OAUTH');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

// Facebook OAuth
router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: ['email']
  })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=facebook_auth_failed`
  }),
  (req, res) => {
    try {
      const user = req.user as any;

      // Generar JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.info('User authenticated via Facebook', 'OAUTH', { userId: user.id });

      // Redirect al frontend con el token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=facebook`);
    } catch (error: any) {
      logger.error(`Facebook callback error: ${error.message}`, 'OAUTH');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  }
);

export default router;
