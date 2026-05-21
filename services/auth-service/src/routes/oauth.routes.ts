import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import {
  buildTikTokAuthUrl,
  exchangeTikTokCode,
  getTikTokUser,
  findOrCreateTikTokUser,
} from '../strategies/tiktok.strategy';

const router = Router();

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar.events',
];

// ─── Google Calendar Connect (separate from login — requests offline calendar scope) ──

router.get('/google/calendar-connect', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const returnUrl = (req.query.return_url as string) || `${frontendUrl}/profile/personal`;
    return res.redirect(`${returnUrl.split('?')[0]}?error=google_not_configured`);
  }

  const token = req.query.token as string | undefined;
  if (!token) {
    return res.redirect(`${frontendUrl}/login`);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.id;
    const returnUrl = (req.query.return_url as string) || `${frontendUrl}/profile/personal?calendarConnected=true`;

    // Encode userId + returnUrl in a short-lived state token
    const state = jwt.sign({ userId, returnUrl }, process.env.JWT_SECRET!, { expiresIn: '10m' });

    const callbackUrl =
      process.env.GOOGLE_CALENDAR_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}/auth/google/calendar-connect/callback`;

    const oAuth2 = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      callbackUrl,
    );

    const authUrl = oAuth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: CALENDAR_SCOPES,
      state,
    } as any);

    return res.redirect(authUrl);
  } catch (err: any) {
    logger.error(`Calendar connect init error: ${err.message}`, 'OAUTH');
    return res.redirect(`${frontendUrl}/login?error=invalid_token`);
  }
});

router.get('/google/calendar-connect/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const defaultBase = `${frontendUrl}/profile/personal`;

  // Resolve returnBase early (before try) so catch block can use it too
  let returnBase = defaultBase;
  const rawState = req.query.state as string | undefined;
  if (rawState) {
    try {
      const s = jwt.verify(rawState, process.env.JWT_SECRET!) as any;
      if (s.returnUrl) {
        // returnUrl already includes the success query param — strip it for error redirects
        returnBase = s.returnUrl.split('?')[0];
      }
    } catch { /* ignore, use default */ }
  }

  try {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };

    if (error) {
      logger.warn(`Google Calendar OAuth denied: ${error}`, 'OAUTH');
      return res.redirect(`${returnBase}?error=calendar_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${returnBase}?error=calendar_invalid`);
    }

    const decoded = jwt.verify(state, process.env.JWT_SECRET!) as any;
    const userId: string = decoded.userId;
    const returnUrl: string = decoded.returnUrl || `${defaultBase}?calendarConnected=true`;

    const callbackUrl =
      process.env.GOOGLE_CALENDAR_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}/auth/google/calendar-connect/callback`;

    const oAuth2 = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      callbackUrl,
    );

    const { tokens } = await oAuth2.getToken(code);

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleCalendarEnabled: true,
      } as any,
    });

    logger.info('Google Calendar connected', 'OAUTH', { userId });
    return res.redirect(returnUrl);
  } catch (err: any) {
    logger.error(`Calendar connect callback error: ${err.message}`, 'OAUTH');
    return res.redirect(`${returnBase}?error=calendar_failed`);
  }
});

// GET /auth/google-calendar/status — returns { enabled: boolean } for the authenticated user
router.get('/google-calendar/status', async (req, res) => {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    (req.cookies as any)?.auth_token ||
    (req.cookies as any)?.token ||
    '';

  if (!token) return res.json({ enabled: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { googleCalendarEnabled: true } as any,
    });
    return res.json({ enabled: !!(user as any)?.googleCalendarEnabled });
  } catch {
    return res.json({ enabled: false });
  }
});

// GET /auth/google-calendar/disconnect — removes stored tokens
router.post('/google-calendar/disconnect', async (req, res) => {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    (req.cookies as any)?.auth_token ||
    (req.cookies as any)?.token ||
    '';

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiresAt: null,
        googleCalendarEnabled: false,
      } as any,
    });
    logger.info('Google Calendar disconnected', 'OAUTH', { userId: decoded.id });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

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
