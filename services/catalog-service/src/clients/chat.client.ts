import { logger } from '../utils/logger';

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://chat-service:4010';

export class ChatClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CHAT_SERVICE_URL;
  }

  private getInternalSecret(): string {
    return process.env.INTERNAL_SERVICE_SECRET || '';
  }

  async createOrGetGroupConversation(params: {
    bookingId?: string;
    eventId?: string;
    createdBy: string;
    participantIds: string[];
    name?: string;
  }): Promise<{ group: any } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/internal/group-conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': this.getInternalSecret(),
        },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' })) as any;
        logger.error('[ChatClient] Error creando grupo postulación', 'CHAT_CLIENT', { error: error.message });
        return null;
      }
      return await response.json();
    } catch (error: any) {
      logger.error('[ChatClient] Error de conexión con chat-service', 'CHAT_CLIENT', { error: error.message });
      return null;
    }
  }
  async getGroupByBookingId(bookingId: string): Promise<{ id: string } | null> {
    try {
      const url = `${this.baseUrl}/internal/group-conversations/by-reference?bookingId=${encodeURIComponent(bookingId)}`;
      const response = await fetch(url, {
        headers: { 'x-internal-secret': this.getInternalSecret() },
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      return data?.group ?? null;
    } catch {
      return null;
    }
  }
}

export const chatClient = new ChatClient();
