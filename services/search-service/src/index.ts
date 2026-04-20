import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import healthRoutes from './routes/health.routes';
import searchRoutes from './routes/search.routes';
import { searchService } from './services/search.service';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4009;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(apiLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.debug('REQUEST', {
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Search Service running on port ${PORT}`);

  // Auto-reindex all artists on startup (fire-and-forget)
  setTimeout(() => {
    searchService.bulkIndexArtists().catch((err: Error) => {
      logger.error(`Startup reindex failed: ${err.message}`);
    });
  }, 3000); // 3s delay so DB connections settle
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
