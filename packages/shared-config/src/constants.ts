// ============================================================================
// @piums/shared-config — Application-wide constants
// ============================================================================

export const APP = {
  NAME: 'Piums',
  FULL_NAME: 'Piums Platform',
  DOMAIN: 'piums.com',
  SUPPORT_EMAIL: 'soporte@piums.com',
  VERSION: '1.0.0',
} as const;

export const AUTH = {
  JWT_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
  COOKIE_NAME: 'auth_token',
  REFRESH_COOKIE_NAME: 'refresh_token',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 2,
} as const;

export const UPLOAD = {
  MAX_AVATAR_SIZE_MB: 5,
  MAX_COVER_SIZE_MB: 10,
  MAX_PORTFOLIO_SIZE_MB: 20,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  CLOUDINARY_FOLDERS: {
    AVATARS: 'piums/avatars',
    COVERS: 'piums/covers',
    PORTFOLIO: 'piums/portfolio',
    CERTIFICATIONS: 'piums/certifications',
  },
} as const;

export const BOOKING = {
  MIN_ADVANCE_HOURS: 2,
  MAX_ADVANCE_DAYS: 365,
  REMINDER_HOURS: [24, 2],
  CANCELLATION_FEE_HOURS: 24, // free cancellation window
  PLATFORM_FEE_PERCENT: 10,
} as const;

export const RATE_LIMITS = {
  GENERAL_WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
  GENERAL_MAX: 100,
  LOGIN_MAX: 10,
  REGISTER_MAX: 5,
  FORGOT_PASSWORD_MAX: 3,
  RESEND_VERIFICATION_MAX: 3,
  UPLOAD_MAX: 20,
} as const;

export const CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://piums.com',
  'https://app.piums.com',
  'https://artist.piums.com',
] as const;
