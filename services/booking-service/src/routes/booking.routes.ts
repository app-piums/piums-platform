import { Router } from "express";
import { bookingController } from "../controller/booking.controller";
import { authenticateToken, requireAdmin, internalAuth, requireActiveSession } from "../middleware/auth.middleware";
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
  requireActiveSession,
  createBookingLimiter,
  bookingController.createBooking.bind(bookingController)
);

// ==================== RUTAS FIJAS (deben ir ANTES de /bookings/:id) ====================

/**
 * GET /api/bookings/sonidista-check
 * Busca sonidistas disponibles para la fecha, ciudad y duración indicadas.
 * Llamado por web-client en el paso de Review del booking funnel.
 */
router.get(
  "/bookings/sonidista-check",
  authenticateToken,
  bookingController.getSonidistaCheck.bind(bookingController)
);

router.get(
  "/bookings/stats",
  authenticateToken,
  bookingController.getBookingStats.bind(bookingController)
);

/**
 * GET /api/bookings/artists/:artistId/public-stats
 * Conteo de contrataciones completadas para el perfil público del artista.
 * Server-to-server: pasa con x-internal-secret; si no, exige admin.
 */
router.get(
  "/bookings/artists/:artistId/public-stats",
  (req, res, next) => {
    const secret = req.headers["x-internal-secret"];
    const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";
    if (INTERNAL_SECRET && secret === INTERNAL_SECRET) return next();
    return authenticateToken(req, res, (err) => { if (err) return next(err); return requireAdmin(req, res, next); });
  },
  bookingController.getArtistPublicStats.bind(bookingController)
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
 * GET  /api/bookings/:id/replacement       — obtener estado de búsqueda de reemplazo
 * POST /api/bookings/:id/replacement/accept — el cliente acepta buscar reemplazo
 * POST /api/bookings/:id/replacement/decline — el cliente rechaza la búsqueda
 */
router.get(
  "/bookings/:id/replacement",
  authenticateToken,
  bookingController.getReplacementSearch.bind(bookingController)
);
router.post(
  "/bookings/:id/replacement/accept",
  authenticateToken,
  bookingController.acceptReplacement.bind(bookingController)
);
router.post(
  "/bookings/:id/replacement/decline",
  authenticateToken,
  bookingController.declineReplacement.bind(bookingController)
);

/**
 * POST /api/bookings/:id/verify-attendance
 * Artista ingresa el código de asistencia del cliente → completa la reserva sin esperar 24h.
 * Para servicios con entrega de producto, solo marca IN_PROGRESS (pago se libera al entregar).
 */
router.post(
  "/bookings/:id/verify-attendance",
  authenticateToken,
  bookingController.verifyAttendanceCode.bind(bookingController)
);

/**
 * POST /api/bookings/:id/confirm-delivery
 * Confirmar recepcion del servicio (solo el cliente de la reserva)
 */
router.post(
  "/bookings/:id/confirm-delivery",
  authenticateToken,
  bookingController.confirmDelivery.bind(bookingController)
);

/**
 * POST /api/bookings/:id/report-delivery-problem
 * Reportar problema con la entrega — abre disputa y congela payout (solo el cliente)
 */
router.post(
  "/bookings/:id/report-delivery-problem",
  authenticateToken,
  bookingController.reportDeliveryProblem.bind(bookingController)
);

/**
 * POST /api/bookings/:id/no-show
 * Reportar no-show del artista (solo el cliente de la reserva)
 */
router.post(
  "/bookings/:id/no-show",
  authenticateToken,
  bookingController.reportNoShow.bind(bookingController)
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
 * Cambiar estado — artista puede poner IN_PROGRESS / COMPLETED / NO_SHOW
 * El service valida internamente que booking.artistId === userId
 */
router.patch(
  "/bookings/:id/status",
  authenticateToken,
  requireActiveSession,
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

/**
 * GET /api/bookings/users/:userId/stats
 * Obtener estadísticas de un usuario específico
 */
router.get(
  "/bookings/users/:userId/stats",
  authenticateToken,
  bookingController.getUserStats.bind(bookingController)
);

router.post(
  "/bookings/admin/batch-stats",
  (req, res, next) => {
    const secret = req.headers["x-internal-secret"];
    const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";
    if (INTERNAL_SECRET && secret === INTERNAL_SECRET) return next();
    return authenticateToken(req, res, (err) => { if (err) return next(err); return requireAdmin(req, res, next); });
  },
  bookingController.getBatchStats.bind(bookingController)
);

/**
 * GET /api/bookings/stats/admin
 * Obtener estadísticas globales para el admin
 */
router.get(
  "/bookings/stats/admin",
  (req, res, next) => {
    // Acepta internal secret O JWT admin
    const secret = req.headers["x-internal-secret"];
    const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";
    if (INTERNAL_SECRET && secret === INTERNAL_SECRET) return next();
    return authenticateToken(req, res, (err) => {
      if (err) return next(err);
      return requireAdmin(req, res, next);
    });
  },
  bookingController.getAdminStats.bind(bookingController)
);

/**
 * GET /api/bookings/admin/search
 * Buscar en TODAS las reservas (admin)
 */
router.get(
  "/bookings/admin/search",
  (req, res, next) => {
    const secret = req.headers["x-internal-secret"];
    const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";
    if (INTERNAL_SECRET && secret === INTERNAL_SECRET) return next();
    return authenticateToken(req, res, (err) => { if (err) return next(err); return requireAdmin(req, res, next); });
  },
  bookingController.adminSearchBookings.bind(bookingController)
);

/**
 * GET /api/bookings/admin/:id
 * Obtener detalle de una reserva (solo admin)
 */
router.get(
  "/bookings/admin/:id",
  (req, res, next) => {
    const secret = req.headers["x-internal-secret"];
    const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";
    if (INTERNAL_SECRET && secret === INTERNAL_SECRET) return next();
    return authenticateToken(req, res, (err) => { if (err) return next(err); return requireAdmin(req, res, next); });
  },
  bookingController.adminGetBookingById.bind(bookingController)
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

// ==================== SOLICITUDES DE CAMBIO DE FECHA ====================

/**
 * POST /api/bookings/:id/reschedule-request
 * Cliente solicita cambio de fecha
 */
router.post(
  "/bookings/:id/reschedule-request",
  authenticateToken,
  createBookingLimiter,
  bookingController.createRescheduleRequest.bind(bookingController)
);

/**
 * POST /api/reschedule-requests/:requestId/respond
 * Artista acepta o rechaza la solicitud
 */
router.post(
  "/reschedule-requests/:requestId/respond",
  authenticateToken,
  updateLimiter,
  bookingController.respondToReschedule.bind(bookingController)
);

/**
 * GET /api/reschedule-requests/confirm?token=xxx
 * Cliente confirma el cambio de fecha (público, viene del email)
 */
router.get(
  "/reschedule-requests/confirm",
  bookingController.confirmRescheduleByToken.bind(bookingController)
);

/**
 * GET /api/bookings/:id/reschedule-requests
 * Listar historial de solicitudes de cambio de fecha
 */
router.get(
  "/bookings/:id/reschedule-requests",
  authenticateToken,
  bookingController.listRescheduleRequests.bind(bookingController)
);

// ==================== RUTAS INTERNAS (solo inter-servicio) ====================

router.get(
  "/bookings/internal/:id",
  internalAuth,
  bookingController.internalGetBooking.bind(bookingController)
);

router.post(
  "/bookings/internal/:id/mark-payment",
  internalAuth,
  bookingController.internalMarkPayment.bind(bookingController)
);

router.post(
  "/bookings/internal/:id/mark-card-authorized",
  internalAuth,
  bookingController.internalMarkCardAuthorized.bind(bookingController)
);

export default router;
