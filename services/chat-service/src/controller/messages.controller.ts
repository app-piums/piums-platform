import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await chatService.getMessages(conversationId, userId, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { conversationId, content, type = 'TEXT' } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ message: 'conversationId y content son requeridos' });
    }

    const message = await chatService.sendMessage(conversationId, userId, content, type);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const { id } = req.params;
    const message = await chatService.markAsRead(id, userId);
    res.json({ message });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const count = await chatService.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};
