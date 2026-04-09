import { Router } from "express";
import { bookingController } from "../controller/booking.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  createBookingLimiter,
  updateLimiter,
  availabilityLimiter,
} from "../middleware/rateLimiter";

const router: Router = Router();

// ==================== RESERVAS ====================

/**
 * POST /api/bookings
 * Crear nueva reserva
 * Requiere autenticación (cliente)
 */
router.post(
  "/bookings",
  authenticateToken,
  createBookingLimiter,
  bookingController.createBooking.bind(bookingController)
);

/**
 * GET /api/bookings/:id
 * Obtener reserva por ID
 * Requiere autenticación (cliente o artista)
 */
router.get(
  "/bookings/:id",
  authenticateToken,
  bookingController.getBookingById.bind(bookingController)
);

/**
 * GET /api/bookings/by-code/:code
 * Obtener reserva por código (ej: PIU-2026-000123)
 * Requiere autenticación (cliente o artista)
 */
router.get(
  "/bookings/by-code/:code",
  authenticateToken,
  bookingController.getBookingByCode.bind(bookingController)
);

/**
 * GET /api/bookings
 * Buscar reservas con filtros
 * Requiere autenticación
 */
router.get(
  "/bookings",
  authenticateToken,
  bookingController.searchBookings.bind(bookingController)
);

/**
 * PUT /api/bookings/:id
 * Actualizar reserva
 * Requiere autenticación (cliente o artista)
 */
router.put(
  "/bookings/:id",
  authenticateToken,
  updateLimiter,
  bookingController.updateBooking.bind(bookingController)
);

/**
 * POST /api/bookings/:id/confirm
 * Confirmar reserva
 * Requiere autenticación (artista)
 */
router.post(
  "/bookings/:id/confirm",
  authenticateToken,
  bookingController.confirmBooking.bind(bookingController)
);

/**
 * POST /api/bookings/:id/reject
 * Rechazar reserva
 * Requiere autenticación (artista)
 */
router.post(
  "/bookings/:id/reject",
  authenticateToken,
  bookingController.rejectBooking.bind(bookingController)
);

/**
 * POST /api/bookings/:id/cancel
 * Cancelar reserva
 * Requiere autenticación (cliente o artista)
 */
router.post(
  "/bookings/:id/cancel",
  authenticateToken,
  bookingController.cancelBooking.bind(bookingController)
);

/**
 * PATCH /api/bookings/:id/reschedule
 * Reprogramar reserva
 * Requiere autenticación (cliente o artista)
 */
router.patch(
  "/bookings/:id/reschedule",
  authenticateToken,
  updateLimiter,
  bookingController.rescheduleBooking.bind(bookingController)
);

/**
 * PATCH /api/bookings/:id/status
 * Cambiar estado de reserva
 * Requiere autenticación (artista)
 */
router.patch(
  "/bookings/:id/status",
  authenticateToken,
  bookingController.changeStatus.bind(bookingController)
);

/**
 * POST /api/bookings/:id/payment
 * Marcar pago
 * Requiere autenticación (admin o sistema de pagos)
 */
router.post(
  "/bookings/:id/payment",
  authenticateToken,
  bookingController.markPayment.bind(bookingController)
);

// ==================== DISPONIBILIDAD ====================

/**
 * GET /api/availability/check
 * Verificar si un horario está disponible
 * Público
 */
router.get(
  "/availability/check",
  availabilityLimiter,
  bookingController.checkAvailability.bind(bookingController)
);

/**
 * GET /api/availability/slots
 * Obtener slots disponibles
 * Público
 */
router.get(
  "/availability/slots",
  availabilityLimiter,
  bookingController.getAvailableSlots.bind(bookingController)
);

/**
 * GET /api/availability/busy-artists?date=YYYY-MM-DD
 * Devuelve los IDs de artistas con reservas en una fecha dada
 * Público
 */
router.get(
  "/availability/busy-artists",
  availabilityLimiter,
  bookingController.getArtistsBusyOnDate.bind(bookingController)
);

// ==================== SLOTS BLOQUEADOS ====================

/**
 * POST /api/blocked-slots
 * Bloquear slot de tiempo
 * Requiere autenticación (artista)
 */
router.post(
  "/blocked-slots",
  authenticateToken,
  createBookingLimiter,
  bookingController.blockSlot.bind(bookingController)
);

/**
 * GET /api/artists/:artistId/blocked-slots
 * Obtener slots bloqueados de un artista
 * Público
 */
router.get(
  "/artists/:artistId/blocked-slots",
  bookingController.getBlockedSlots.bind(bookingController)
);

/**
 * DELETE /api/blocked-slots/:id
 * Desbloquear slot
 * Requiere autenticación (artista)
 */
router.delete(
  "/blocked-slots/:id",
  authenticateToken,
  bookingController.unblockSlot.bind(bookingController)
);

// ==================== CONFIGURACIÓN ====================

/**
 * GET /api/artists/:artistId/config
 * Obtener configuración de disponibilidad del artista
 * Público
 */
router.get(
  "/artists/:artistId/config",
  bookingController.getArtistConfig.bind(bookingController)
);

/**
 * PUT /api/artists/:artistId/config
 * Actualizar configuración de disponibilidad
 * Requiere autenticación (artista)
 */
router.put(
  "/artists/:artistId/config",
  authenticateToken,
  updateLimiter,
  bookingController.updateArtistConfig.bind(bookingController)
);

// ==================== ESTADÍSTICAS ====================

router.get(
  "/stats",
  authenticateToken,
  bookingController.getBookingStats.bind(bookingController)
);

/**
 * GET /api/bookings/users/:userId/stats
 * Obtener estadísticas de un usuario específico
 */
router.get(
  "/users/:userId/stats",
  bookingController.getUserStats.bind(bookingController)
);

router.post(
  "/admin/batch-stats",
  bookingController.getBatchStats.bind(bookingController)
);

/**
 * GET /api/bookings/stats/admin
 * Obtener estadísticas globales para el admin
 */
router.get(
  "/stats/admin",
  bookingController.getAdminStats.bind(bookingController)
);

/**
 * GET /api/admin/bookings/:id
 * Obtener detalle de una reserva (llamada interna desde auth-service)
 */
router.get(
  "/admin/bookings/:id",
  bookingController.adminGetBookingById.bind(bookingController)
);

/**
 * GET /api/bookings/admin/search
 * Buscar en TODAS las reservas (admin)
 */
router.get(
  "/admin/search",
  bookingController.adminSearchBookings.bind(bookingController)
);

/**
 * GET /api/bookings/:id/pdf
 * Descargar PDF con detalles de la reserva
 * Requiere autenticación (cliente o artista)
 */
router.get(
  "/bookings/:id/pdf",
  authenticateToken,
  bookingController.downloadBookingPDF.bind(bookingController)
);

export default router;
