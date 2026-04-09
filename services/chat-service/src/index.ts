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

// Middlewares globales
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chat-service', timestamp: new Date().toISOString() });
});

// Rutas API
app.use('/api/chat/conversations', conversationsRoutes);
app.use('/api/chat/messages', messagesRoutes);

// Middleware de error handling (debe ir al final)
app.use(errorHandler);

// Inicializar WebSocket Gateway
const chatGateway = new ChatGateway(httpServer);
logger.info('WebSocket Gateway initialized', 'SERVER');

const PORT = process.env.PORT || 4010;

httpServer.listen(PORT, () => {
  logger.info(`Chat Service running on http://localhost:${PORT}`, 'SERVER');
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}/socket.io/`, 'SERVER');
  logger.info(`Health check: http://localhost:${PORT}/health`, 'SERVER');
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`, 'SERVER');
});
