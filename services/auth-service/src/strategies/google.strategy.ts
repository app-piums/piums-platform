import passport from 'passport';
import { CURRENT_TERMS_VERSION } from '../config/terms';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export const configureGoogleStrategy = () => {
  // Solo configurar si existen las credenciales
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.warn('Google OAuth credentials not configured, skipping Google strategy', 'OAUTH');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4001/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Buscar usuario existente
          let user = await prisma.user.findUnique({
            where: { email }
          });

          if (user) {
            // Usuario existe - actualizar provider si es necesario
            if (user.provider !== 'google') {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  provider: 'google',
                  googleId: profile.id,
                  isVerified: true // Email verificado por Google
                }
              });
            }

            logger.info('User logged in via Google', 'GOOGLE_OAUTH', { userId: user.id });
          } else {
            // Crear nuevo usuario
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || email.split('@')[0],
                nombre: profile.displayName || email.split('@')[0],
                provider: 'google',
                googleId: profile.id,
                isVerified: true, // Email verificado por Google
                role: 'user',
                termsAcceptedAt: new Date(),
                termsVersion: CURRENT_TERMS_VERSION,
              }
            });

            logger.info('New user created via Google', 'GOOGLE_OAUTH', { userId: user.id });
          }

          return done(null, user);
        } catch (error: any) {
          logger.error(`Google OAuth error: ${error.message}`, 'GOOGLE_OAUTH');
          return done(error, undefined);
        }
      }
      // Cast necesario: @types/passport-google-oauth20 se compila contra
      // @types/express v5 mientras @types/passport usa @types/express v4.
      // Solo es una incompatibilidad de definiciones de tipos; en runtime
      // la Strategy es totalmente compatible con passport.use().
    ) as unknown as passport.Strategy
  );
};

// Serializar usuario para la sesión
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserializar usuario desde la sesión
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
