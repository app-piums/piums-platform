import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { messageLimiter } from '../middleware/rateLimiter';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../controller/messages.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/unread-count', getUnreadCount);
router.get('/:conversationId', getMessages);
router.post('/', messageLimiter, sendMessage);
router.patch('/:id/read', markAsRead);

export default router;
