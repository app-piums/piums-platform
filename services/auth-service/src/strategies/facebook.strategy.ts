import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const configureFacebookStrategy = () => {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID!,
        clientSecret: process.env.FACEBOOK_APP_SECRET!,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:4001/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name', 'displayName']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Facebook profile'), undefined);
          }

          // Buscar usuario existente
          let user = await prisma.user.findUnique({
            where: { email }
          });

          if (user) {
            // Usuario existe - actualizar provider si es necesario
            if (user.provider !== 'facebook') {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  provider: 'facebook',
                  facebookId: profile.id,
                  isVerified: true // Email verificado por Facebook
                }
              });
            }

            logger.info('User logged in via Facebook', 'FACEBOOK_OAUTH', { userId: user.id });
          } else {
            // Crear nuevo usuario
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}` || email.split('@')[0],
                provider: 'facebook',
                facebookId: profile.id,
                isVerified: true, // Email verificado por Facebook
                role: 'user'
              }
            });

            logger.info('New user created via Facebook', 'FACEBOOK_OAUTH', { userId: user.id });
          }

          return done(null, user);
        } catch (error: any) {
          logger.error(`Facebook OAuth error: ${error.message}`, 'FACEBOOK_OAUTH');
          return done(error, undefined);
        }
      }
    )
  );
};
