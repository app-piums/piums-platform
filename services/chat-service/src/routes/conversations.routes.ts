import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getConversations,
  getConversation,
  createConversation,
  markConversationAsRead,
  activateConversation,
} from '../controller/conversations.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getConversations);
router.get('/:id', getConversation);
router.post('/', createConversation);
router.patch('/:id/read', markConversationAsRead);
router.patch('/booking/:bookingId/activate', activateConversation);

export default router;
