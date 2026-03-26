import { PrismaClient } from '@prisma/client';
import Filter from 'bad-words';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

export const chatEmitter = new EventEmitter();

const prisma = new PrismaClient();
const filter = new Filter();

export class ChatService {
  // ==================== CONVERSATIONS ====================

  async getConversations(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where: {
            OR: [
              { userId },
              { artistId: userId },
            ],
          },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { lastMessageAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.conversation.count({
          where: {
            OR: [
              { userId },
              { artistId: userId },
            ],
          },
        }),
      ]);

      // Count unread messages for each conversation
      const conversationsWithUnread = await Promise.all(
        conversations.map(async (conversation: any) => {
          const unreadCount = await prisma.message.count({
            where: {
              conversationId: conversation.id,
              senderId: { not: userId },
              read: false,
            },
          });

          return {
            ...conversation,
            unreadCount,
          };
        })
      );

      return {
        conversations: conversationsWithUnread,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      logger.error('Error fetching conversations', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al obtener conversaciones');
    }
  }

  async getConversation(conversationId: string, userId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new AppError(404, 'Conversación no encontrada');
      }

      // Verificar que el usuario tenga acceso a esta conversación
      if (conversation.userId !== userId && conversation.artistId !== userId) {
        throw new AppError(403, 'No tienes acceso a esta conversación');
      }

      return conversation;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching conversation', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al obtener conversación');
    }
  }

  async createConversation(userId: string, artistId: string, bookingId?: string) {
    try {
      // Check if conversation already exists
      const existing = await prisma.conversation.findFirst({
        where: {
          userId,
          artistId,
        },
      });

      if (existing) {
        // Si ya existe pero el bookingId es diferente (raro), podríamos actualizarlo o simplemente devolver la existente
        return existing;
      }

      const conversation = await prisma.conversation.create({
        data: {
          userId,
          artistId,
          bookingId,
          status: 'PENDING', // Inicia como PENDING por defecto al crear desde booking
        },
      });

      logger.info('Conversation created', 'CHAT_SERVICE', { conversationId: conversation.id, status: conversation.status });
      return conversation;
    } catch (error: any) {
      logger.error('Error creating conversation', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al crear conversación');
    }
  }

  async updateConversationStatus(conversationId: string, status: 'PENDING' | 'ACTIVE' | 'ARCHIVED') {
    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: { status },
      });

      logger.info('Conversation status updated', 'CHAT_SERVICE', { conversationId, status });
      return conversation;
    } catch (error: any) {
      logger.error('Error updating conversation status', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al actualizar estado de la conversación');
    }
  }

  async activateConversationByBookingId(bookingId: string) {
    try {
      const conversation = await prisma.conversation.update({
        where: { bookingId },
        data: { status: 'ACTIVE' },
      });

      logger.info('Conversation activated by bookingId', 'CHAT_SERVICE', { bookingId, conversationId: conversation.id });
      return conversation;
    } catch (error: any) {
      logger.error('Error activating conversation by bookingId', 'CHAT_SERVICE', error);
      // No lanzamos error si no existe la conversación, solo loggueamos
      return null;
    }
  }

  // ==================== MESSAGES ====================

  async getMessages(conversationId: string, userId: string, page: number = 1, limit: number = 50) {
    try {
      // Verificar acceso
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new AppError(404, 'Conversación no encontrada');
      }

      if (conversation.userId !== userId && conversation.artistId !== userId) {
        throw new AppError(403, 'No tienes acceso a esta conversación');
      }

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.message.count({
          where: { conversationId },
        }),
      ]);

      return {
        messages: messages.reverse(), // Ordenar ascendente para mostrar
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching messages', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al obtener mensajes');
    }
  }

  async sendMessage(conversationId: string, senderId: string, content: string, type: string = 'text') {
    try {
      // Verificar acceso
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new AppError(404, 'Conversación no encontrada');
      }

      if (conversation.userId !== senderId && conversation.artistId !== senderId) {
        throw new AppError(403, 'No tienes acceso a esta conversación');
      }

      // Solo se permite enviar mensajes cuando la conversación está ACTIVE.
      // Conversaciones ligadas a una reserva inician en PENDING hasta que el artista confirma.
      if (conversation.status !== 'ACTIVE' && conversation.bookingId) {
        throw new AppError(403, 'El chat se habilitará cuando el artista confirme la reserva');
      }

      // Moderation: filtrar malas palabras
      let filteredContent = content;
      if (type === 'text') {
        filteredContent = filter.clean(content);
      }

      // Determinar senderType
      const senderType = conversation.artistId === senderId ? 'artist' : 'user';

      // Crear mensaje
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          senderType,
          content: filteredContent,
          type,
        },
      });

      // Actualizar lastMessageAt de la conversación
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      logger.info('Message sent', 'CHAT_SERVICE', { messageId: message.id });
      
      // Emit to WebSocket Gateway
      chatEmitter.emit('new_message', message, conversation);
      
      return message;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error sending message', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al enviar mensaje');
    }
  }

  async markAsRead(messageId: string, userId: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true },
      });

      if (!message) {
        throw new AppError(404, 'Mensaje no encontrado');
      }

      // Solo puede marcar como leído el destinatario (no el emisor)
      if (message.senderId === userId) {
        throw new AppError(400, 'No puedes marcar tu propio mensaje como leído');
      }

      // Verificar acceso a la conversación
      if (message.conversation.userId !== userId && message.conversation.artistId !== userId) {
        throw new AppError(403, 'No tienes acceso a este mensaje');
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return updatedMessage;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error marking message as read', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al marcar mensaje como leído');
    }
  }

  async markConversationAsRead(conversationId: string, userId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new AppError(404, 'Conversación no encontrada');
      }

      if (conversation.userId !== userId && conversation.artistId !== userId) {
        throw new AppError(403, 'No tienes acceso a esta conversación');
      }

      // Marcar todos los mensajes no leídos de otros usuarios
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      logger.info('Conversation marked as read', 'CHAT_SERVICE', { conversationId });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Error marking conversation as read', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al marcar conversación como leída');
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await prisma.message.count({
        where: {
          conversation: {
            OR: [
              { userId },
              { artistId: userId },
            ],
          },
          senderId: { not: userId },
          read: false,
        },
      });

      return count;
    } catch (error: any) {
      logger.error('Error getting unread count', 'CHAT_SERVICE', error);
      throw new AppError(500, 'Error al obtener contador de mensajes no leídos');
    }
  }
}
