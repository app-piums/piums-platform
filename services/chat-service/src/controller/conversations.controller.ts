import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await chatService.getConversations(userId, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { id } = req.params;
    const conversation = await chatService.getConversation(id, userId);
    res.json({ conversation });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { artistId, bookingId } = req.body;

    if (!artistId) {
      return res.status(400).json({ message: 'artistId es requerido' });
    }

    const conversation = await chatService.createConversation(userId, artistId, bookingId);
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
};

export const markConversationAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { id } = req.params;
    await chatService.markConversationAsRead(id, userId);
    res.json({ message: 'Conversación marcada como leída' });
  } catch (error) {
    next(error);
  }
};

export const activateConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const conversation = await chatService.activateConversationByBookingId(bookingId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversación no encontrada para este booking' });
    }

    res.json({ conversation, message: 'Conversación activada' });
  } catch (error) {
    next(error);
  }
};
