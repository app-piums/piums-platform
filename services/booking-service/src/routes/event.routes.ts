import { Router } from 'express';
import { eventController } from '../controller/event.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { createBookingLimiter, updateLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

/**
 * POST /api/events
 * Crear nuevo evento
 */
router.post('/events', authenticateToken, createBookingLimiter, eventController.createEvent.bind(eventController));

/**
 * GET /api/events
 * Listar eventos del cliente autenticado
 */
router.get('/events', authenticateToken, eventController.getClientEvents.bind(eventController));

/**
 * GET /api/events/:id
 * Obtener evento con sus bookings
 */
router.get('/events/:id', authenticateToken, eventController.getEvent.bind(eventController));

/**
 * PUT /api/events/:id
 * Actualizar datos del evento
 */
router.put('/events/:id', authenticateToken, updateLimiter, eventController.updateEvent.bind(eventController));

/**
 * DELETE /api/events/:id
 * Cancelar evento (body: { cancelBookings: boolean })
 */
router.delete('/events/:id', authenticateToken, eventController.cancelEvent.bind(eventController));

/**
 * POST /api/events/:id/bookings
 * Agregar booking existente al evento
 */
router.post('/events/:id/bookings', authenticateToken, updateLimiter, eventController.addBookingToEvent.bind(eventController));

/**
 * DELETE /api/events/:id/bookings/:bookingId
 * Quitar booking del evento
 */
router.delete('/events/:id/bookings/:bookingId', authenticateToken, eventController.removeBookingFromEvent.bind(eventController));

/**
 * GET /api/events/:id/breakdown
 * Desglose de precios del evento
 */
router.get('/events/:id/breakdown', authenticateToken, eventController.getEventBreakdown.bind(eventController));

export default router;
