import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import {
  buildTikTokAuthUrl,
  exchangeTikTokCode,
  getTikTokUser,
  findOrCreateTikTokUser,
} from '../strategies/tiktok.strategy';

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

// ─── TikTok OAuth (PKCE) ──────────────────────────────────────────────────────

router.get('/tiktok', (req, res) => {
  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    logger.warn('TikTok OAuth credentials not configured', 'OAUTH');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=tiktok_not_configured`);
  }

  try {
    const authUrl = buildTikTokAuthUrl(req.session as any);
    // Save session before redirecting so code_verifier + state are persisted
    (req.session as any).save(() => {
      res.redirect(authUrl);
    });
  } catch (error: any) {
    logger.error(`TikTok auth init error: ${error.message}`, 'OAUTH');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=tiktok_auth_failed`);
  }
});

router.get('/tiktok/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  try {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (error) {
      logger.warn(`TikTok denied: ${error}`, 'OAUTH');
      return res.redirect(`${frontendUrl}/login?error=tiktok_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/login?error=tiktok_invalid_response`);
    }

    const session = req.session as any;

    // Validate CSRF state
    if (state !== session.tiktokState) {
      logger.warn('TikTok state mismatch (possible CSRF)', 'OAUTH');
      return res.redirect(`${frontendUrl}/login?error=tiktok_state_mismatch`);
    }

    const codeVerifier = session.tiktokCodeVerifier;
    if (!codeVerifier) {
      return res.redirect(`${frontendUrl}/login?error=tiktok_session_expired`);
    }

    // Clear PKCE values from session
    delete session.tiktokCodeVerifier;
    delete session.tiktokState;

    // Exchange authorization code for access token
    const accessToken = await exchangeTikTokCode(code, codeVerifier);

    // Fetch TikTok profile
    const tiktokUser = await getTikTokUser(accessToken);

    // Find or create user in our DB
    const user = await findOrCreateTikTokUser(tiktokUser);

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    logger.info('User authenticated via TikTok', 'OAUTH', { userId: user.id });
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=tiktok`);
  } catch (error: any) {
    logger.error(`TikTok callback error: ${error.message}`, 'OAUTH');
    res.redirect(`${frontendUrl}/login?error=tiktok_auth_failed`);
  }
});

export default router;
