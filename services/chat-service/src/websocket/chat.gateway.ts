import { Server as SocketServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Server as HttpServer } from 'http';
import { verifySocketToken } from '../middleware/auth.middleware';
import { ChatService } from '../services/chat.service';
import { logger } from '../utils/logger';

const chatService = new ChatService();

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      email: string;
    };
  };
  userId?: string;
  email?: string;
}

export class ChatGateway {
  private io: SocketServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
      path: '/socket.io/',
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    // Initialize Redis adapter when REDIS_HOST is defined (required for K8s multi-replica)
    // Falls back to in-memory adapter when REDIS_HOST is not set (local dev)
    if (process.env.REDIS_HOST) {
      const redisOptions = {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
      };
      const pubClient = new Redis(redisOptions);
      const subClient = pubClient.duplicate();

      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          this.io.adapter(createAdapter(pubClient, subClient));
          logger.info('Socket.io Redis adapter connected', 'CHAT_GATEWAY');
        })
        .catch((err) => {
          logger.error('Redis adapter connection failed, falling back to in-memory', 'CHAT_GATEWAY', err);
        });
    }

    // Listen to HTTP POST messages being created and broadcast them via WebSocket
    import('../services/chat.service').then(({ chatEmitter }) => {
      chatEmitter.on('new_message', (message, conversation) => {
        const recipientId = conversation.participant1Id === message.senderId ? conversation.participant2Id : conversation.participant1Id;
        
        // Notify recipient if connected
        this.io.to(`user:${recipientId}`).emit('message:received', message);
        
        // Notify sender if connected across other tabs
        this.io.to(`user:${message.senderId}`).emit('message:received', message);
      });
    });
  }

  // Helper to get the other participant
  private getOtherParticipant(conversation: any, currentUserId: string): string {
    return conversation.participant1Id === currentUserId ? conversation.participant2Id : conversation.participant1Id;
  }

  private setupMiddleware() {
    // Autenticación en conexión
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        logger.warn('Socket connection without token', 'CHAT_GATEWAY');
        return next(new Error('Authentication error: No token provided'));
      }

      const user = await verifySocketToken(token);
      if (!user) {
        logger.warn('Socket connection with invalid token', 'CHAT_GATEWAY');
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = user.id;
      socket.email = user.email;
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info(`User connected: ${userId}`, 'CHAT_GATEWAY', { socketId: socket.id });

      // Guardar mapping userId -> socketId
      this.userSockets.set(userId, socket.id);

      // Join user to their personal room
      socket.join(`user:${userId}`);

      // ==================== EVENTS ====================

      // Enviar mensaje
      socket.on('message:send', async (data: {
        conversationId: string;
        content: string;
        type?: string;
      }) => {
        try {
          // Obtener la conversación para saber a quién enviar y verificar status
          const conversation = await chatService.getConversation(data.conversationId, userId);
          
          if (conversation.status !== 'ACTIVE') {
            return socket.emit('message:error', { message: 'La conversación aún no está activa.' });
          }

          const message = await chatService.sendMessage(
            data.conversationId,
            userId,
            data.content,
            data.type || 'TEXT'
          );

          // Enviar el mensaje al emisor
          socket.emit('message:sent', { message });

          const recipientId = this.getOtherParticipant(conversation, userId);

          // Enviar al destinatario si está conectado
          const recipientSocketId = this.userSockets.get(recipientId);
          if (recipientSocketId) {
            this.io.to(`user:${recipientId}`).emit('message:received', { message });
          }

          logger.info('Message sent via WebSocket', 'CHAT_GATEWAY', { messageId: message.id });
        } catch (error: any) {
          logger.error('Error sending message via WebSocket', 'CHAT_GATEWAY', error);
          socket.emit('message:error', { error: error.message });
        }
      });

      // Marcar como leído
      socket.on('message:read', async (data: { messageId: string }) => {
        try {
          const message = await chatService.markAsRead(data.messageId, userId);

          // Notificar al emisor del mensaje que fue leído
          const senderSocketId = this.userSockets.get(message.senderId);
          if (senderSocketId) {
            this.io.to(`user:${message.senderId}`).emit('message:read', { messageId: message.id });
          }

          logger.info('Message marked as read via WebSocket', 'CHAT_GATEWAY', { messageId: message.id });
        } catch (error: any) {
          logger.error('Error marking message as read', 'CHAT_GATEWAY', error);
          socket.emit('message:error', { error: error.message });
        }
      });

      // Usuario está escribiendo
      socket.on('typing:start', async (data: { conversationId: string }) => {
        try {
          const conversation = await chatService.getConversation(data.conversationId, userId);
          const recipientId = this.getOtherParticipant(conversation, userId);

          // Notificar al otro usuario
          this.io.to(`user:${recipientId}`).emit('typing:start', {
            conversationId: data.conversationId,
            userId,
          });

          logger.debug('User started typing', 'CHAT_GATEWAY', { userId, conversationId: data.conversationId });
        } catch (error: any) {
          logger.error('Error handling typing:start', 'CHAT_GATEWAY', error);
        }
      });

      // Usuario dejó de escribir
      socket.on('typing:stop', async (data: { conversationId: string }) => {
        try {
          const conversation = await chatService.getConversation(data.conversationId, userId);
          const recipientId = this.getOtherParticipant(conversation, userId);

          // Notificar al otro usuario
          this.io.to(`user:${recipientId}`).emit('typing:stop', {
            conversationId: data.conversationId,
            userId,
          });

          logger.debug('User stopped typing', 'CHAT_GATEWAY', { userId, conversationId: data.conversationId });
        } catch (error: any) {
          logger.error('Error handling typing:stop', 'CHAT_GATEWAY', error);
        }
      });

      // Join a una conversación específica (opcional, para rooms por conversación)
      socket.on('conversation:join', (data: { conversationId: string }) => {
        socket.join(`conversation:${data.conversationId}`);
        logger.debug(`User joined conversation room`, 'CHAT_GATEWAY', { userId, conversationId: data.conversationId });
      });

      // Leave de una conversación
      socket.on('conversation:leave', (data: { conversationId: string }) => {
        socket.leave(`conversation:${data.conversationId}`);
        logger.debug(`User left conversation room`, 'CHAT_GATEWAY', { userId, conversationId: data.conversationId });
      });

      // Desconexión
      socket.on('disconnect', () => {
        this.userSockets.delete(userId);
        logger.info(`User disconnected: ${userId}`, 'CHAT_GATEWAY', { socketId: socket.id });
      });
    });
  }

  // Método para enviar notificaciones desde el backend
  public notifyUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}
