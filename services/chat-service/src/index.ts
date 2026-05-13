import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import conversationsRoutes from './routes/conversations.routes';
import messagesRoutes from './routes/messages.routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { ChatGateway } from './websocket/chat.gateway';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);

// Trust the gateway/load-balancer proxy so rate-limiter reads the real client IP
app.set('trust proxy', 1);

// Middlewares globales
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check BEFORE rate limiter — K8s probes no deben contabilizarse en el límite
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chat-service', timestamp: new Date().toISOString() });
});

// Rate limiter solo sobre rutas /api
app.use('/api', apiLimiter);
app.use('/api/chat/conversations', conversationsRoutes);
app.use('/api/chat/messages', messagesRoutes);

// Middleware de error handling (debe ir al final)
app.use(errorHandler);

// Inicializar WebSocket Gateway
const chatGateway = new ChatGateway(httpServer);

// Internal endpoint — emits a socket event to a specific user
// Called by other services (notifications-service, etc.) using x-internal-secret
app.post('/internal/notify', (req, res) => {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret || req.headers['x-internal-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { userId, event, data } = req.body;
  if (!userId || !event) {
    return res.status(400).json({ error: 'userId and event are required' });
  }
  chatGateway.notifyUser(userId, event, data ?? {});
  return res.json({ ok: true });
});

app.post('/internal/notify-admins', (req, res) => {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret || req.headers['x-internal-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { event, data } = req.body;
  if (!event) {
    return res.status(400).json({ error: 'event is required' });
  }
  chatGateway.notifyAdmins(event, data ?? {});
  return res.json({ ok: true });
});
logger.info('WebSocket Gateway initialized', 'SERVER');

const PORT = process.env.PORT || 4010;

httpServer.listen(PORT, () => {
  logger.info(`Chat Service running on http://localhost:${PORT}`, 'SERVER');
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}/socket.io/`, 'SERVER');
  logger.info(`Health check: http://localhost:${PORT}/health`, 'SERVER');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`, 'SERVER');
});
