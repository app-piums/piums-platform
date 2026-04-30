import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import healthRoutes from './routes/health.routes';
import notificationRoutes from './routes/notification.routes';
import bookingRoutes from './routes/booking.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4006;

// ============================================================================
// Middleware
// ============================================================================

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
app.use(apiRateLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, 'HTTP_REQUEST', {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ============================================================================
// Routes
// ============================================================================

app.use(healthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications/booking', bookingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  logger.info(`Notifications service started on port ${PORT}`, 'SERVER', {
    port: PORT,
    env: process.env.NODE_ENV,
  });
  
  logger.info('Features enabled:', 'SERVER', {
    email: process.env.ENABLE_EMAIL === 'true',
    sms: process.env.ENABLE_SMS === 'true',
    push: process.env.ENABLE_PUSH === 'true',
  });
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', 'SERVER');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully', 'SERVER');
  process.exit(0);
});
