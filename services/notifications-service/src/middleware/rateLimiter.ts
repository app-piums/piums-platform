import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Send notification rate limiter (more restrictive)
export const sendRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 notifications per hour
  message: 'Too many notifications sent, please try again later.',
  skipSuccessfulRequests: false,
});

// Batch send rate limiter
export const batchSendRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 batch sends per hour
  message: 'Too many batch sends, please try again later.',
});

// User preferences update rate limiter
export const preferencesRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many preference updates, please try again later.',
});
