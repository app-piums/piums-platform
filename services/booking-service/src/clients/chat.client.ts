import jwt from 'jsonwebtoken';
import { logger } from "../utils/logger";

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://chat-service:4010';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_CHANGE_IN_PRODUCTION';

interface CreateConversationPayload {
  artistId: string;
  bookingId: string;
}

export class ChatClient {
  private baseUrl: string;
  private secret: string;

  constructor() {
    this.baseUrl = CHAT_SERVICE_URL;
    this.secret = JWT_SECRET;
  }

  /**
   * Generar token de servicio
   */
  private getServiceToken(userId: string): string {
    return jwt.sign({ id: userId, role: 'system' }, this.secret, { expiresIn: '1h' });
  }

  /**
   * Crear una conversación para una reserva
   */
  async createConversation(userId: string, artistId: string, bookingId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getServiceToken(userId)}`,
        },
        body: JSON.stringify({ artistId, bookingId, userId }), 
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' })) as any;
        logger.error('[ChatClient] Error creando conversación', 'CHAT_CLIENT', { error: error.message });
        return null;
      }

      return await response.json();
    } catch (error: any) {
      logger.error('[ChatClient] Error de conexión con chat-service', 'CHAT_CLIENT', { error: error.message });
      return null;
    }
  }

  /**
   * Activar una conversación cuando se confirma la reserva
   */
  async activateConversation(bookingId: string, userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/conversations/booking/${bookingId}/activate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getServiceToken(userId)}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' })) as any;
        logger.error('[ChatClient] Error activando conversación', 'CHAT_CLIENT', { error: error.message });
        return null;
      }

      return await response.json();
    } catch (error: any) {
      logger.error('[ChatClient] Error de conexión con chat-service', 'CHAT_CLIENT', { error: error.message });
      return null;
    }
  }
}

export const chatClient = new ChatClient();
